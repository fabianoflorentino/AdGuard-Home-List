import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { FetchResult } from './types';

const URL_PATTERN = /^https?:\/\//i;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

export async function readLines(filePath: string): Promise<string[]> {
  const data = await readFile(filePath, { encoding: 'utf8' });
  return data.split(/\r?\n/);
}

export async function getRemoteLines(
  url: string,
  options: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<FetchResult> {
  if (!URL_PATTERN.test(url)) {
    return { ok: false, lines: [], error: 'not a valid http(s) URL' };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'AdGuard-Home-List/1.0' },
    });

    if (!response.ok) {
      return {
        ok: false,
        lines: [],
        status: response.status,
        error: response.statusText,
      };
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0');

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        lines: [],
        status: response.status,
        error: `response too large (${contentLength} bytes)`,
      };
    }

    const text = await response.text();

    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      return {
        ok: false,
        lines: [],
        status: response.status,
        error: 'response too large',
      };
    }

    return {
      ok: true,
      lines: text.split(/\r?\n/),
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      lines: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const workerCount = Math.max(1, Math.min(limit, items.length));
  let nextIndex = 0;

  const run = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const item = items[currentIndex];

      if (item === undefined) {
        return;
      }

      results[currentIndex] = await worker(item, currentIndex);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => run()));
  return results;
}
