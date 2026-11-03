import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';

const HOST_PREFIXES = new Set(['0.0.0.0', '127.0.0.1', '::1']);
const URL_PATTERN = /^https?:\/\//i;
const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function stripComment(line: string): string {
  return (
    line
      .replace(/^\uFEFF/, '')
      .split('#')[0]
      ?.split('!')[0]
      ?.trim() ?? ''
  );
}

export function fromAdGuardRule(line: string): string | null {
  const value = stripComment(line);

  if (value === '') {
    return null;
  }

  return value;
}

export function fromHostsOrIp(line: string, allowRule: boolean): string[] {
  const value = stripComment(line);

  if (value === '') {
    return [];
  }

  const tokens = value.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  const firstToken = tokens[0] ?? '';
  const firstTokenWithoutPort = firstToken.replace(/:\d+$/, '');
  let domainTokens = tokens;

  if (HOST_PREFIXES.has(firstToken) || isIP(firstTokenWithoutPort) !== 0) {
    domainTokens = tokens.slice(1);

    if (domainTokens.length === 0) {
      if (HOST_PREFIXES.has(firstToken) || isIP(firstTokenWithoutPort) === 0) {
        return [];
      }

      return [
        allowRule
          ? `@@${firstTokenWithoutPort}$network`
          : `${firstTokenWithoutPort}$network`,
      ];
    }
  }

  const rules: string[] = [];

  for (const token of domainTokens) {
    const domain = normalizeDomain(token);

    if (domain === null) {
      continue;
    }

    rules.push(allowRule ? `@@||${domain}^$important` : `||${domain}^`);
  }

  return rules;
}

export function normalizeDomain(value: string): string | null {
  let candidate = value.trim().toLowerCase().replace(/\.$/, '');

  if (candidate === '') {
    return null;
  }

  if (URL_PATTERN.test(candidate)) {
    try {
      candidate = new URL(candidate).hostname;
    } catch {
      return null;
    }
  } else {
    candidate = candidate
      .replace(/:\d+$/, '')
      .replace(/[?#].*$/, '')
      .replace(/\/.*$/, '')
      .replace(/^\.+/, '');
  }

  candidate = candidate.replace(/^\*\./, '');
  candidate = candidate.replace(/\.+$/, '');

  if (candidate === '') {
    return null;
  }

  const ascii = domainToASCII(candidate);
  candidate = ascii === '' ? candidate : ascii;

  if (!DOMAIN_PATTERN.test(candidate)) {
    return null;
  }

  return candidate;
}
