import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { RuleList } from './list';
import { formatNumber, renderBadge, renderList } from './render';

function buildList(): RuleList {
  const list = new RuleList();
  list.add('||b.com^', ['source-b']);
  list.add('||a.com^', ['source-a']);
  return list;
}

test('formatNumber adds thousands separators', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(1234567), '1,234,567');
});

test('renderList writes a deterministic header and sorted rules', () => {
  const output = renderList(buildList(), {
    debug: false,
    convertToAllow: false,
  });

  assert.ok(output.endsWith('\n'));
  assert.ok(output.includes('! Title: AdGuard Home List - Block'));
  assert.ok(output.includes('! Total rules: 2'));
  assert.ok(output.indexOf('||a.com^') < output.indexOf('||b.com^'));
});

test('renderList includes origins in debug mode', () => {
  const output = renderList(buildList(), {
    debug: true,
    convertToAllow: true,
  });

  assert.ok(output.includes('||a.com^ #source-a'));
  assert.ok(output.includes('||b.com^ #source-b'));
});

test('renderBadge produces the shields.io endpoint schema', () => {
  const badge = JSON.parse(renderBadge(buildList(), true)) as {
    label: string;
    message: string;
    color: string;
  };

  assert.deepEqual(badge, {
    schemaVersion: 1,
    label: 'Allow',
    message: '2',
    color: 'green',
  });
});
