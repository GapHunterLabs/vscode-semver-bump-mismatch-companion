import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChangelog, parseSemVer, findMismatches } from '../semverBump';

test('parseChangelog reads Keep a Changelog headers in order', () => {
  const text = [
    '# Changelog',
    '',
    '## [Unreleased]',
    '',
    '## [2.0.0] - 2026-01-01',
    'Body two',
    '',
    '## [1.0.0] - 2025-01-01',
    'Body one',
  ].join('\n');
  const entries = parseChangelog(text);
  assert.deepEqual(
    entries.map((e) => e.version),
    ['Unreleased', '2.0.0', '1.0.0'],
  );
});

test('parseChangelog captures body text between headers', () => {
  const text = ['## [1.1.0]', 'Added a thing', '', '## [1.0.0]', 'Initial release'].join('\n');
  const entries = parseChangelog(text);
  assert.match(entries[0].bodyText, /Added a thing/);
});

test('parseSemVer parses major.minor.patch', () => {
  assert.deepEqual(parseSemVer('2.3.1'), { major: 2, minor: 3, patch: 1 });
});

test('parseSemVer returns null for a non-semver string', () => {
  assert.equal(parseSemVer('Unreleased'), null);
});

test('findMismatches flags a BREAKING release with only a minor bump', () => {
  const text = [
    '## [1.1.0] - 2026-01-01',
    'BREAKING: removed the old API entirely.',
    '',
    '## [1.0.0] - 2025-01-01',
    'Initial release.',
  ].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].entry.version, '1.1.0');
  assert.equal(hits[0].previousVersion, '1.0.0');
});

test('findMismatches does not flag a correct MAJOR bump', () => {
  const text = ['## [2.0.0]', 'BREAKING: removed the old API.', '', '## [1.0.0]', 'Initial.'].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 0);
});

test('findMismatches does not flag a non-breaking minor bump', () => {
  const text = ['## [1.1.0]', 'Added a new feature.', '', '## [1.0.0]', 'Initial.'].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 0);
});

test('findMismatches flags a ### Removed section as breaking too', () => {
  const text = ['## [1.1.0]', '### Removed', '- the old export', '', '## [1.0.0]', 'Initial.'].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 1);
});

test('findMismatches skips 0.x releases entirely', () => {
  const text = ['## [0.2.0]', 'BREAKING: everything changed.', '', '## [0.1.0]', 'Initial.'].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 0);
});

test('findMismatches ignores [Unreleased]', () => {
  const text = ['## [Unreleased]', 'BREAKING: WIP.', '', '## [1.0.0]', 'Initial.'].join('\n');
  const hits = findMismatches(parseChangelog(text));
  assert.equal(hits.length, 0);
});
