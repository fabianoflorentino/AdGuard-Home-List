import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { RuleList } from './list';

test('RuleList deduplicates rules and merges origins', () => {
  const list = new RuleList();

  list.add('||b.com^', ['file-b']);
  list.add('||a.com^', ['file-a']);
  list.add('||b.com^', ['file-c']);

  assert.equal(list.size, 2);
  assert.deepEqual(list.entries(), [
    ['||a.com^', ['file-a']],
    ['||b.com^', ['file-b', 'file-c']],
  ]);
});

test('RuleList keeps a deterministic sort order', () => {
  const list = new RuleList();

  for (const rule of ['||z.com^', '||a.com^', '||m.com^']) {
    list.add(rule, ['file']);
  }

  assert.deepEqual(
    list.entries().map(([rule]) => rule),
    ['||a.com^', '||m.com^', '||z.com^'],
  );
});
