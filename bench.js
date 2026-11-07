// Benchmark: node bench.js [--show] [--level N] [--voice V] [file-filter]
// AI samples should score high before and low after; human samples should score low and barely change.
// Every output is also checked for mechanical damage (broken capitals, articles, punctuation) the rules left behind.
'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./src/engine.js');

const args = process.argv.slice(2);
const opt = n => args.includes(n) ? args[args.indexOf(n) + 1] : null;
const show = args.includes('--show');
const levels = opt('--level') ? [+opt('--level')] : [2, 3, 4];
const voices = opt('--voice') === 'all' ? P.VOICES : [opt('--voice') || 'neutral'];
const filter = args.filter((a, i) => !a.startsWith('--') && !['--level', '--voice', '--kind'].includes(args[i - 1]))[0] || '';

const ABBR = /(?:e\.g|i\.e|etc|vs|approx|cf)\.$/i;
// Each check returns the offending snippets in a text.
const CHECKS = {
  'lowercase sentence start': t => {
    const out = [];
    for (const m of t.matchAll(/(\S*)([.!?])(["')\]]*)\s+([a-z][\w'-]*)/g))
      if (!ABBR.test(m[1] + m[2]) && !/^(?:iPhone|iOS|npm|pH|eBay)$/.test(m[4])) out.push(m[0]);
    for (const m of t.matchAll(/^(?:[-*•]\s+|\d+[.)]\s+|#{1,6}\s+)?([a-z][\w'-]*)/gm))
      if (!/^(?:iPhone|iOS|npm|pH|eBay)$/.test(m[1])) out.push(m[0]);
    return out;
  },
  'a before vowel sound': t => [...t.matchAll(/\b[Aa] ([aeiouAEIOU][\w-]*)/g)].map(m => m[0]).filter(x => !/ (?:uni|use|usu|one|eu|U[A-Z])/i.test(x)),
  'an before consonant': t => [...t.matchAll(/\b[Aa]n ([b-df-hj-np-tv-z][\w-]*)/g)].map(m => m[0]).filter(x => !/ (?:hour|honest|heir|hono)/i.test(x)),
  'doubled word': t => [...t.matchAll(/\b(\w+)\s+\1\b/gi)].map(m => m[0]).filter(x => !/^(?:that that|had had|is is)$/i.test(x)),
  'stray punctuation': t => t.replace(/```[\s\S]*?```|`[^`]*`/g, '').match(/ [,.;:!?](?!\d)|[,;:][ \t]*[.!?]|[^.]\.\.(?!\.)|,\s*,|\(\s*\)|^[ \t]*[,.;:]/gm) || [],
  'orphan connector': t => t.match(/(?:^|[.!?]\s+)(?:And|But|So|Or|Also)[,.]?\s*(?:[.!?]|$)/gm) || [],
  'dangling list marker or heading': t => t.match(/^[ \t]*(?:[-*•]|#{1,6})[ \t]*$/gm) || [],
  'trailing space': t => t.match(/[ \t]+$/gm) || [],
  'subjectless verb start': t => t.match(/(?:^|[.!?]\s+)(?:Is|Are|Was|Were|Has|Have)\s+(?:a|an|the|to|not)\b[^.?!]*\./gm) || [],
  'dangling comma clause': t => t.match(/,\s+(?:and|but|or)\s*[.!?]/g) || []
};

function damage(before, out) {
  const found = [];
  for (const [label, fn] of Object.entries(CHECKS)) {
    const pool = fn(before), extra = [];
    for (const x of fn(out)) { const i = pool.indexOf(x); if (i >= 0) pool.splice(i, 1); else extra.push(x); }
    if (extra.length) found.push(label + ': ' + JSON.stringify(extra.slice(0, 4)));
  }
  return found;
}

const wc = t => (t.match(/\S+/g) || []).length;
let totalDamage = 0, totalFacts = 0;
const rows = [];
const kinds = opt('--kind') ? [opt('--kind')] : ['ai', 'human'];
for (const voice of voices) for (const kind of kinds) {
  const dir = path.join(__dirname, 'bench', kind);
  for (const f of fs.readdirSync(dir).filter(f => f.includes(filter)).sort()) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n?/g, '\n');
    const row = { kind, f, voice, s0: P.score(src), out: {} };
    for (const L of levels) {
      const r = P.run(src, L, { voice });
      const dmg = damage(src, r.text), lost = P.checkFacts(src, r.text).lost;
      totalDamage += dmg.length; totalFacts += lost.length;
      row.out[L] = { s1: P.score(r.text), tells: r.tells, kept: wc(r.text) / Math.max(1, wc(src)), flags: P.findFlags(r.text).length };
      const tag = kind + '/' + f + ' L' + L + ' ' + voice;
      if (show && L === levels[levels.length - 1]) console.log('\n===== ' + tag + ' =====\n' + r.text);
      if (dmg.length) console.log('  DAMAGE ' + tag + ':\n    ' + dmg.join('\n    '));
      if (lost.length) console.log('  FACTS LOST ' + tag + ': ' + lost.join(', '));
    }
    rows.push(row);
  }
}
console.log('\nfile                     before  ' + levels.map(L => ('L' + L + ' score/tells/kept/flags').padEnd(27)).join(''));
for (const r of rows)
  console.log((r.kind + '/' + r.f + (voices.length > 1 ? ' ' + r.voice : '')).padEnd(24).slice(0, 24) + ' ' + String(r.s0).padStart(6) + '  ' +
    levels.map(L => { const o = r.out[L]; return (String(o.s1).padStart(5) + ' / ' + String(o.tells).padStart(3) + ' / ' + (o.kept * 100).toFixed(0).padStart(3) + '% / ' + o.flags).padEnd(27); }).join(''));
const avg = (k, fn) => { const xs = rows.filter(r => r.kind === k).map(fn); return (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1); };
console.log('\nAI    mean score before ' + avg('ai', r => r.s0) + ' | after ' + levels.map(L => 'L' + L + ' ' + avg('ai', r => r.out[L].s1)).join(', '));
console.log('Human mean score before ' + avg('human', r => r.s0) + ' | after ' + levels.map(L => 'L' + L + ' ' + avg('human', r => r.out[L].s1)).join(', ') + ' | changes ' + levels.map(L => 'L' + L + ' ' + avg('human', r => r.out[L].tells)).join(', '));
console.log('Damage findings: ' + totalDamage + ' | facts lost: ' + totalFacts);
process.exitCode = totalDamage || totalFacts ? 1 : 0;
