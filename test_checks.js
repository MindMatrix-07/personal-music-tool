// Simple test harness for checks (node)

function estimateSyllables(line) {
  if (!line) return 0;
  const words = line.split(/[^A-Za-z]+/).filter(Boolean);
  let total = 0;
  words.forEach(w => {
    const lw = w.toLowerCase();
    const vgroups = lw.replace(/e\b/, '').match(/[aeiouy]{1,2}/g);
    total += (vgroups ? vgroups.length : 1);
  });
  return total;
}

function runChecksOnText(text) {
  const lines = text.split(/\r?\n/);
  const report = [];
  const maxLen = 42;
  lines.forEach((ln, i) => {
    if (ln.trim().length === 0) return;
    if (ln.length > maxLen) report.push(`Line ${i+1}: Too long (${ln.length} chars)`);
  });
  lines.forEach((ln, i) => {
    const syl = estimateSyllables(ln);
    if (syl > 18) report.push(`Line ${i+1}: High syllable count (~${syl})`);
  });
  return report;
}

// Demo
const sample = `this is a very long lyric line that will likely exceed the limit
Short line
What are you doing
मेरा नाम राहुल`;

console.log('Running checks...');
console.log(runChecksOnText(sample));

module.exports = { estimateSyllables, runChecksOnText };
