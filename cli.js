#!/usr/bin/env node
// Plainspoken CLI. Same engine as the app, no network, no dependencies.
'use strict';
const fs = require('fs');
const P = require('./src/engine.js');

const args = process.argv.slice(2);
let ai = false, model = 'openrouter/auto';
const opt = { level: 2, voice: 'neutral', contractions: true, quotes: true, keep: [], sample: '' };
const files = [];
let mode = 'text';
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') mode = 'help';
  else if (a === '-l' || a === '--level') opt.level = Math.min(4, Math.max(1, +args[++i] || 2));
  else if (a === '-v' || a === '--voice') opt.voice = args[++i];
  else if (a === '-k' || a === '--keep') opt.keep = String(args[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
  else if (a === '-s' || a === '--sample') opt.sample = fs.readFileSync(args[++i], 'utf8');
  else if (a === '--no-contractions') opt.contractions = false;
  else if (a === '--no-quote-protection') opt.quotes = false;
  else if (a === '--ai') ai = true;
  else if (a === '--model') model = args[++i];
  else if (a === '--score') mode = 'score';
  else if (a === '--stats') mode = 'stats';
  else if (a === '--check') mode = 'check';
  else if (a === '--json') mode = 'json';
  else if (a === '--diff') mode = 'diff';
  else if (a === '-i' || a === '--in-place') mode = 'inplace';
  else files.push(a);
}

if (mode === 'help') {
  console.log(`plainspoken [options] [file ...]   (reads stdin when no file is given)

  -l, --level 1|2|3|4      light, standard (default), aggressive, max (rhythm engineering, up to 3 passes)
  -v, --voice NAME         neutral (default), casual, direct, formal, technical
  -k, --keep "a,b"         words that must stay exactly as written
  -s, --sample FILE        a sample of your own writing; the output adapts to its rhythm and habits
      --no-contractions    leave "do not" alone
      --no-quote-protection  also edit text inside double quotes
      --score              print the 0-100 AI-tell score and verdict only
      --stats              print writing stats before and after
      --check              list what is still flagged; exit 1 if anything is
      --diff               print the result as a word diff ([-removed-] {+added+})
      --ai                 polish with an LLM through OpenRouter (key from env OPENROUTER_API_KEY; nothing to install, needs Node 18+)
      --model ID           OpenRouter model id for --ai (default openrouter/auto)
      --json               print text, changes, flags, metrics and fact check as JSON
  -i, --in-place           overwrite the input files`);
  process.exit(0);
}

const read = f => f ? fs.readFileSync(f, 'utf8') : fs.readFileSync(0, 'utf8');
const inputs = files.length ? files.map(f => [f, read(f)]) : [[null, read(null)]];
let exit = 0;

(async () => {
for (const [f, text] of inputs) {
  let r = P.run(text, opt.level, opt);
  if (ai) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) { console.error('Set OPENROUTER_API_KEY first.'); process.exit(2); }
    try {
      const res = await P.polish(r.text, Object.assign({}, opt, { key, model }));
      res.warnings.forEach(w => console.error('warning: ' + w));
      r = Object.assign(P.run(res.text, opt.level, opt), {});
    } catch (e) { console.error('AI polish failed: ' + e.message); process.exit(2); }
  }
  const name = f || 'stdin';
  if (mode === 'score') { const m = P.metrics(text); console.log((f ? f + ': ' : '') + m.total + ' ' + m.verdict); }
  else if (mode === 'stats') {
    const a = P.metrics(text), b = P.metrics(r.text);
    const row = (n, x, y) => console.log('  ' + n.padEnd(30) + String(x).padStart(8) + '  ->' + String(y).padStart(8));
    console.log(name);
    row('AI-tell score', a.total, b.total); row('Reading ease', a.stats.ease.toFixed(0), b.stats.ease.toFixed(0));
    row('Average sentence', a.stats.avg.toFixed(1), b.stats.avg.toFixed(1)); row('Sentence spread (CoV)', a.stats.cov.toFixed(2), b.stats.cov.toFixed(2));
    row('Vocabulary variety (MATTR)', a.stats.mattr.toFixed(2), b.stats.mattr.toFixed(2)); row('Repeated phrases', (a.stats.trigram * 100).toFixed(1) + '%', (b.stats.trigram * 100).toFixed(1) + '%');
  } else if (mode === 'check') {
    const fl = P.findFlags(text), m = P.metrics(text);
    console.log(name + ': score ' + m.total + ' (' + m.verdict + '), ' + r.tells + ' fixable tells, ' + fl.length + ' flags');
    fl.forEach(x => console.log('  - ' + x.label + ': ' + x.text));
    if (r.tells || fl.length) exit = 1;
  } else if (mode === 'diff') {
    const ops = P.diff(text, r.text) || [];
    console.log(ops.map(o => o.t === '=' ? o.v : o.t === '-' ? '[-' + o.v + '-]' : '{+' + o.v + '+}').join(''));
  } else if (mode === 'json') {
    console.log(JSON.stringify({ file: f, text: r.text, changes: r.changes, flags: P.findFlags(r.text), before: P.metrics(text), after: P.metrics(r.text), facts: P.checkFacts(text, r.text), readability: P.readabilityGuard(text, r.text) }, null, 2));
  } else if (mode === 'inplace' && f) fs.writeFileSync(f, r.text + '\n');
  else process.stdout.write(r.text + '\n');
}
process.exit(exit);
})();
