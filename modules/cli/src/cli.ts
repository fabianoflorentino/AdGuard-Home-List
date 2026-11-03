import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fromAdGuardRule, fromHostsOrIp } from './adguard';
import {
  getRemoteLines,
  listFiles,
  mapLimit,
  pathExists,
  readLines,
} from './files';
import { RuleList } from './list';
import { Logger } from './logger';
import { renderBadge, renderList } from './render';
import type { GenerateOptions, SourceStats } from './types';

const CONCURRENCY = 8;
const URL_PATTERN = /^https?:\/\//i;

const USAGE = `Usage:
  adguard-home-list generate --name <file> --external <dir> --custom <dir> \\
    --concatExternal <dir> --output <dir> [--badge <file>] [--convertToAllow true] [--debug]

Options:
  -n, --name <file>             Output list file name
  -b, --badge <file>            Output badge JSON file name
  -e, --external <dir>          Directory containing external list URLs
  -c, --custom <dir>            Directory containing custom AdGuard rules
      --concatExternal <dir>    Directory containing raw AdGuard list URLs
  -o, --output <dir>            Output directory
      --convertToAllow <bool>   Convert external hosts rules to allow rules
      --debug                   Also write a debug list with rule origins
  -h, --help                    Show this help
`;

export async function runCli(
  argv: string[],
  logger = new Logger(),
): Promise<void> {
  let parsed;

  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        name: { type: 'string', short: 'n' },
        badge: { type: 'string', short: 'b' },
        external: { type: 'string', short: 'e' },
        concatExternal: { type: 'string' },
        custom: { type: 'string', short: 'c' },
        output: { type: 'string', short: 'o' },
        convertToAllow: { type: 'string' },
        debug: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (error) {
    logger.info(USAGE);
    throw error;
  }

  if (parsed.values.help) {
    logger.info(USAGE);
    return;
  }

  let options: GenerateOptions;

  try {
    options = validateOptions(parsed.values);
  } catch (error) {
    logger.info(USAGE);
    throw error;
  }

  await ensureDirectory(options.output);
  await requireDirectory(options.external, '--external');
  await requireDirectory(options.custom, '--custom');
  await requireDirectory(options.concatExternal, '--concatExternal');

  const list = new RuleList();
  const stats: SourceStats = { total: 0, ok: 0, failed: 0, empty: 0 };

  await loadCustomRules(options.custom, list, logger);
  await loadConcatSources(options.concatExternal, list, stats, logger);
  await loadExternalSources(
    options.external,
    options.convertToAllow,
    list,
    stats,
    logger,
  );

  const listPath = path.join(options.output, options.name);
  await writeFile(
    listPath,
    renderList(list, {
      debug: false,
      convertToAllow: options.convertToAllow,
    }),
    'utf8',
  );

  if (options.debug) {
    await writeFile(
      path.join(options.output, `debug.${options.name}`),
      renderList(list, {
        debug: true,
        convertToAllow: options.convertToAllow,
      }),
      'utf8',
    );
  }

  if (options.badge !== undefined) {
    await writeFile(
      path.join(options.output, options.badge),
      renderBadge(list, options.convertToAllow),
      'utf8',
    );
  }

  logger.info(
    `Sources: ${stats.ok} ok, ${stats.failed} failed, ${stats.empty} empty ` +
      `of ${stats.total}. Generated ${list.size} rules in ${listPath}.`,
  );
}

function validateOptions(
  values: Record<string, string | boolean | undefined>,
): GenerateOptions {
  const name = values.name;
  const external = values.external;
  const custom = values.custom;
  const concatExternal = values.concatExternal;
  const output = values.output;

  if (
    typeof name !== 'string' ||
    typeof external !== 'string' ||
    typeof custom !== 'string' ||
    typeof concatExternal !== 'string' ||
    typeof output !== 'string'
  ) {
    throw new Error(
      'Missing required options: --name, --external, --custom, --concatExternal, --output',
    );
  }

  return {
    name,
    external,
    custom,
    concatExternal,
    output,
    badge: typeof values.badge === 'string' ? values.badge : undefined,
    convertToAllow: values.convertToAllow === 'true',
    debug: Boolean(values.debug),
  };
}

async function ensureDirectory(directory: string): Promise<void> {
  if (!(await pathExists(directory))) {
    await mkdir(directory, { recursive: true });
  }
}

async function requireDirectory(
  directory: string,
  optionName: string,
): Promise<void> {
  if (!(await pathExists(directory))) {
    throw new Error(`Path "${directory}" from ${optionName} does not exist.`);
  }
}

async function loadCustomRules(
  customDirectory: string,
  list: RuleList,
  logger: Logger,
): Promise<void> {
  const files = await listFiles(customDirectory);

  for (const filePath of files) {
    logger.info(`Loading ${filePath}...`);
    const lines = await readLines(filePath);

    for (const line of lines) {
      const rule = fromAdGuardRule(line);

      if (rule !== null) {
        list.add(rule, [filePath]);
      }
    }
  }
}

async function loadConcatSources(
  concatDirectory: string,
  list: RuleList,
  stats: SourceStats,
  logger: Logger,
): Promise<void> {
  const files = await listFiles(concatDirectory);

  for (const filePath of files) {
    logger.info(`Loading ${filePath}...`);
    const urls = await readSourceUrls(filePath);
    const results = await mapLimit(urls, CONCURRENCY, (url) =>
      getRemoteLines(url),
    );

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      const result = results[index];

      if (url === undefined || result === undefined) {
        continue;
      }

      stats.total += 1;

      if (!result.ok) {
        stats.failed += 1;
        logger.warn(`List "${url}" failed: ${result.error ?? 'unknown error'}`);
        continue;
      }

      let added = 0;

      for (const line of result.lines) {
        const rule = fromAdGuardRule(line);

        if (rule !== null) {
          list.add(rule, [filePath, url]);
          added += 1;
        }
      }

      if (added === 0) {
        stats.empty += 1;
        logger.warn(`List "${url}" returned no rules.`);
      } else {
        stats.ok += 1;
      }
    }
  }
}

async function loadExternalSources(
  externalDirectory: string,
  convertToAllow: boolean,
  list: RuleList,
  stats: SourceStats,
  logger: Logger,
): Promise<void> {
  const files = await listFiles(externalDirectory);

  for (const filePath of files) {
    logger.info(`Loading ${filePath}...`);
    const urls = await readSourceUrls(filePath);
    const results = await mapLimit(urls, CONCURRENCY, (url) =>
      getRemoteLines(url),
    );

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      const result = results[index];

      if (url === undefined || result === undefined) {
        continue;
      }

      stats.total += 1;

      if (!result.ok) {
        stats.failed += 1;
        logger.warn(`List "${url}" failed: ${result.error ?? 'unknown error'}`);
        continue;
      }

      let added = 0;

      for (const line of result.lines) {
        for (const rule of fromHostsOrIp(line, convertToAllow)) {
          list.add(rule, [filePath, url]);
          added += 1;
        }
      }

      if (added === 0) {
        stats.empty += 1;
        logger.warn(`List "${url}" returned no rules.`);
      } else {
        stats.ok += 1;
      }
    }
  }
}

async function readSourceUrls(filePath: string): Promise<string[]> {
  const lines = await readLines(filePath);
  const urls = new Set<string>();

  for (const line of lines) {
    const value = line.trim();

    if (URL_PATTERN.test(value)) {
      urls.add(value);
    }
  }

  return [...urls];
}
