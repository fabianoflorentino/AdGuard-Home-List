import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { fromAdGuardRule, fromHostsOrIp, normalizeDomain } from './adguard';

test('fromAdGuardRule strips comments and empty lines', () => {
  assert.equal(fromAdGuardRule('! comment'), null);
  assert.equal(fromAdGuardRule('# comment'), null);
  assert.equal(fromAdGuardRule('   '), null);
  assert.equal(
    fromAdGuardRule('||ads.example.com^ # tracker'),
    '||ads.example.com^',
  );
  assert.equal(
    fromAdGuardRule('@@||safe.example.com^$important'),
    '@@||safe.example.com^$important',
  );
});

test('fromHostsOrIp converts hosts entries to allow rules', () => {
  assert.deepEqual(fromHostsOrIp('0.0.0.0 ads.example.com', true), [
    '@@||ads.example.com^$important',
  ]);
  assert.deepEqual(
    fromHostsOrIp('127.0.0.1 a.example.com b.example.com', false),
    ['||a.example.com^', '||b.example.com^'],
  );
});

test('fromHostsOrIp converts plain IPs to network rules', () => {
  assert.deepEqual(fromHostsOrIp('1.2.3.4', false), ['1.2.3.4$network']);
  assert.deepEqual(fromHostsOrIp('1.2.3.4', true), ['@@1.2.3.4$network']);
  assert.deepEqual(fromHostsOrIp('::1', false), []);
  assert.deepEqual(fromHostsOrIp('0.0.0.0', false), []);
});

test('fromHostsOrIp normalizes URLs, ports and wildcards', () => {
  assert.deepEqual(fromHostsOrIp('https://Example.com/path?x=1', false), [
    '||example.com^',
  ]);
  assert.deepEqual(fromHostsOrIp('example.com:8080', false), [
    '||example.com^',
  ]);
  assert.deepEqual(fromHostsOrIp('*.example.com', false), ['||example.com^']);
  assert.deepEqual(fromHostsOrIp('.example.com', false), ['||example.com^']);
  assert.deepEqual(fromHostsOrIp('example.com?tracking=1', false), [
    '||example.com^',
  ]);
});

test('fromHostsOrIp ignores invalid entries', () => {
  assert.deepEqual(fromHostsOrIp('not a domain', false), []);
  assert.deepEqual(fromHostsOrIp('bad..example.com', false), []);
});

test('normalizeDomain handles trailing dots and unicode domains', () => {
  assert.equal(normalizeDomain('EXAMPLE.com.'), 'example.com');
  assert.equal(normalizeDomain('münchen.de'), 'xn--mnchen-3ya.de');
  assert.equal(normalizeDomain('example.com:443'), 'example.com');
});
