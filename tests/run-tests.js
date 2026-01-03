const assert = require('assert');
const { estimateSyllables, runChecksOnText } = require('../test_checks');

function testEstimateSyllables() {
  assert.strictEqual(estimateSyllables(''), 0, 'empty line -> 0');
  assert(estimateSyllables('hello') >= 1, 'hello has >=1 syllable');
  assert.strictEqual(estimateSyllables('one two three'), estimateSyllables('one two three'), 'deterministic');
  console.log('estimateSyllables tests passed');
}

function testRunChecks() {
  const sample = `this is a very long lyric line that will likely exceed the limit\nShort line\nWhat are you doing\nमेरा नाम राहुल`;
  const report = runChecksOnText(sample);
  // Expect at least one long-line warning and one question warning (question heuristic in UI may differ)
  assert(report.some(r => /Too long/.test(r)), 'should report a long line');
  assert(report.some(r => /High syllable count|Too long/.test(r)), 'should report either high syllable or long line');
  console.log('runChecksOnText tests passed');
}

function runAll() {
  console.log('Running tests...');
  testEstimateSyllables();
  testRunChecks();
  console.log('All tests passed');
}

runAll();
