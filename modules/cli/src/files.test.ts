import { strict as assert } from 'node:assert';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  getRemoteLines,
  listFiles,
  mapLimit,
  pathExists,
  readLines,
} from './files';

test('mapLimit preserves order and respects the concurrency limit', async () => {
  let active = 0;
  let maxActive = 0;

  const results = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (value) => {
    active += 1;
    maxActive = Math.max(maxActive, active);

    await new Promise((resolve) => setTimeout(resolve, 5));

    active -= 1;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8, 10, 12]);
  assert.ok(maxActive <= 2, `max concurrency was ${maxActive}`);
});

test('listFiles walks directories recursively and sorts results', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'adguard-list-'));

  try {
    await writeFile(path.join(directory, 'b.txt'), 'b');
    await writeFile(path.join(directory, 'a.txt'), 'a');
    await mkdir(path.join(directory, 'nested'));
    await writeFile(path.join(directory, 'nested', 'c.txt'), 'c');

    const files = await listFiles(directory);
    assert.deepEqual(
      files.map((file) => path.relative(directory, file)),
      ['a.txt', 'b.txt', path.join('nested', 'c.txt')],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readLines splits on Windows and Unix newlines', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'adguard-lines-'));

  try {
    const file = path.join(directory, 'list.txt');
    await writeFile(file, 'one\r\ntwo\nthree');

    assert.deepEqual(await readLines(file), ['one', 'two', 'three']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('pathExists reports missing and existing paths', async () => {
  assert.equal(await pathExists('/definitely/not/here'), false);
  assert.equal(await pathExists('.'), true);
});

test('getRemoteLines rejects invalid URLs without network calls', async () => {
  const result = await getRemoteLines('not-a-url');
  assert.equal(result.ok, false);
  assert.equal(result.lines.length, 0);
});
