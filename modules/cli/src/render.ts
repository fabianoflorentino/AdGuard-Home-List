import type { RuleList } from './list';

const HOMEPAGE = 'https://github.com/fabianoflorentino/AdGuard-Home-List';

export function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function renderList(
  list: RuleList,
  options: { debug: boolean; convertToAllow: boolean },
): string {
  const label = options.convertToAllow ? 'Allow' : 'Block';
  const header = [
    `! Title: AdGuard Home List - ${label}`,
    '! Description: Open source allowlist and blocklist for AdGuard Home',
    `! Homepage: ${HOMEPAGE}`,
    '! Expires: 1 day',
    `! Total rules: ${formatNumber(list.size)}`,
  ];

  const rules = list
    .entries()
    .map(([rule, origins]) =>
      options.debug ? `${rule} #${origins.join(';')}` : rule,
    );

  return `${[...header, ...rules].join('\n')}\n`;
}

export function renderBadge(list: RuleList, convertToAllow: boolean): string {
  return JSON.stringify({
    schemaVersion: 1,
    label: convertToAllow ? 'Allow' : 'Block',
    message: formatNumber(list.size),
    color: convertToAllow ? 'green' : 'red',
  });
}
