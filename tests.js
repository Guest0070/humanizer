// Run: node tests.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const P = require('./src/engine.js');

let pass = 0, fail = 0;
function t(name, input, expected, opts, level) {
  const out = P.run(input, level || 2, opts || {}).text;
  try {
    if (expected instanceof RegExp) assert.match(out, expected);
    else assert.strictEqual(out, expected);
    pass++;
  } catch (e) { fail++; console.log('FAIL ' + name + '\n  got:  ' + JSON.stringify(out) + '\n  want: ' + expected); }
}
const not = (name, input, re, opts, level) => {
  const out = P.run(input, level || 2, opts || {}).text;
  if (re.test(out)) { fail++; console.log('FAIL ' + name + ' still has ' + re + ': ' + JSON.stringify(out)); } else pass++;
};

// formatting
t('curly quotes', 'He said “go” and it’s fine.', 'He said "go" and it\'s fine.', { contractions: false });
t('emoji + bold', '- 🚀 **Launch:** now', '- Launch: now');
t('em dash', 'A—b', 'A, b');
// artifacts
t('chatbot', 'Certainly! The cat sat. I hope this helps!', 'The cat sat.');
t('let me know', 'The data is clear. Let me know if you want more.', 'The data is clear.');
t('citation debris', 'Cats purr.:contentReference[oaicite:0]{index=0} Dogs bark.', 'Cats purr. Dogs bark.');
t('utm tracking', 'See https://x.com/a?utm_source=chatgpt.com now', 'See https://x.com/a now');
// vocabulary and structure
t('delve', 'We delve into the data.', 'We look at the data.');
t('copula', 'The gallery serves as a hub and boasts four rooms.', 'The gallery is a hub and has four rooms.');
t('can serve', 'It can serve as a guide.', 'It can be a guide.');
t('ing tail', 'The firm opened in 1989, marking a pivotal moment in regional history.', 'The firm opened in 1989.');
t('neg parallel', "It's not just a song, it's a statement.", "It's a statement.");
t('article fix', 'It is a stunning, unique view.', "It's a unique view.");
t('article an', 'This is a vibrant idea.', "This is an idea.".replace('an', 'an'), {}, 2);
t('transition', 'It rained. Additionally, it was cold.', 'It rained. It was cold.');
t('hedge', 'It could potentially help.', 'It could help.');
t('title case', '## Strategic Negotiations And Global Partnerships', '## Strategic negotiations and global partnerships');
t('verbs', 'We leverage tools to empower teams.', 'We use tools to help teams.');
// protection
t('code kept', 'Use `delve into` and utilize it.', 'Use `delve into` and use it.');
t('url kept', 'Visit https://a.com/delve-into now. Moreover, go.', 'Visit https://a.com/delve-into now. Go.');
t('keep list', 'We leverage Leverage Inc.', 'We use Leverage Inc.', { keep: ['Leverage Inc.'] });
// voices
t('casual however', 'However, it works.', 'But it works.', { voice: 'casual' });
t('formal no contraction', 'We do not know.', 'We do not know.', { voice: 'formal' });
t('neutral contraction', 'We do not know.', "We don't know.");
t('direct intensifier', 'It is very quick.', "It's quick.", { voice: 'direct' });
// levels
t('light leaves vocab', 'We delve into it.', 'We delve into it.', {}, 1);
// v3 features
t('quotes protected', 'He said "It is important to note that we leverage this" and left.', 'He said "It is important to note that we leverage this" and left.');
t('quotes unprotected', 'He said "we leverage this" and left.', 'He said "we use this" and left.', { quotes: false });
t('citations kept', 'It works (Smith et al., 2023, pp. 10-12). Moreover, it scales [1, 2].', 'It works (Smith et al., 2023, pp. 10-12). It scales [1, 2].');
t('path then period', 'Edit ./src/a.js. Moreover, run it.', 'Edit ./src/a.js. Run it.');
t('url trailing period', 'See https://x.com/a. Moreover, go.', 'See https://x.com/a. Go.');
t('version kept', 'Use v1.2.3 to leverage it.', 'Use v1.2.3 to use it.');
t('one-line closer', 'Caching cuts repeat work.\n\nThat is the real win.\n\nRetries hide outages.', 'Caching cuts repeat work.\n\nRetries hide outages.');
t('staged candor', 'The data is clear. Here\'s the thing: costs rose.', 'The data is clear. Costs rose.');
t('honestly opener', 'Honestly? It depends.', 'It depends.');
t('hidden chars', 'Hello​ world again.', 'Hello world again.', {}, 1);
t('preamble', 'Here is the rewritten text:\n\n"The cat sat."', 'The cat sat.');
t('announce', 'In this article, we will explore caching. Caching helps.', 'Caching helps.');
t('heading restated', '## Performance\n\nPerformance matters.\n\nUsers leave slow pages.', '## Performance\n\nUsers leave slow pages.');
t('predicate hyphen', 'The report is high-quality. A high-quality report.', 'The report is high quality. A high-quality report.');
t('formal expands', "We don't know. It's fine. I'm sure.", 'We do not know. It is fine. I am sure.', { voice: 'formal' });
t('formal linked to', 'It is linked to growth.', 'It is associated with growth.', { voice: 'formal' });
t('technical keeps robust', 'A robust cache.', 'A robust cache.', { voice: 'technical' });
t('casual however', 'However, we lost.', 'But we lost.', { voice: 'casual' });
t('zh connectors', '在当今数字时代，综上所述，我们赋能企业。', '我们帮助企业。');
t('tail kept in list', 'The aim is clear: streamlining work, enhancing teams, and fostering trust.', /streamlining|simplifying/, {}, 3);
t('ing tail cut', 'The firm opened in 1989, marking a pivotal moment in history.', 'The firm opened in 1989.');
{
  const h = P.highlights('Moreover, we leverage a tool.', 2);
  try { assert(h.some(x => x.label && x.text === 'Moreover, ') && h.map(x => x.text).join('') === 'Moreover, we leverage a tool.'); pass++; } catch (e) { fail++; console.log('FAIL highlights', JSON.stringify(h)); }
}
{
  const long = 'I write short. Then I write a much longer sentence that wanders on for a good while, with clauses and asides, because I like it that way. Short again. I do not mind commas, and I do not mind dashes. We can\'t all write the same, and I wouldn\'t want to. It is how I think, and it is how I talk when I am tired and happy and a little bit loud about it all.';
  const prof = P.calibrate(long.repeat(2));
  try { assert(prof && prof.meanLen > 5); assert.strictEqual(P.run('We do not know. It is fine.', 2, { profile: Object.assign({}, prof, { contractionRate: 0, words: 200 }) }).text, 'We do not know. It is fine.'); pass++; } catch (e) { fail++; console.log('FAIL calibrate'); }
}
{
  const r = P.run('The cat sat on the mat today. It purred for a good while. It slept on the warm mat. It woke up quite soon. Then it ate a small meal.', 4);
  try { assert(/Rhythm varied/.test(JSON.stringify(r.changes))); pass++; } catch (e) { fail++; console.log('FAIL rhythm', JSON.stringify(r)); }
}
{
  const m = P.metrics('Additionally, this pivotal tool serves as a testament to innovation, showcasing a vibrant tapestry of robust features. Moreover, it plays a crucial role in the evolving landscape. Furthermore, it delves into intricate details. In conclusion, the future looks bright.');
  try { assert(m.total > 40 && /AI|Mixed/.test(m.verdict)); pass++; } catch (e) { fail++; console.log('FAIL metrics', m.total, m.verdict); }
}
{
  const g = P.readabilityGuard('One two three. '.repeat(16), 'One.');
  try { assert(g.bad); pass++; } catch (e) { fail++; console.log('FAIL guard', g); }
}
// idempotence: second pass changes nothing
for (const s of ['AI serves as a testament to progress. Moreover, it is a robust tool, enhancing outcomes.', 'Great question! We leverage synergy — and more.']) {
  const a = P.run(s, 3, {}).text, b = P.run(a, 3, {}).text;
  try { assert.strictEqual(b, a); pass++; } catch (e) { fail++; console.log('FAIL idempotent: ' + JSON.stringify(a) + ' -> ' + JSON.stringify(b)); }
}
// facts and scoring
const f = P.checkFacts('Revenue grew 62% in 2024 at ACME.', 'Revenue grew in 2024 at ACME.');
try { assert.deepStrictEqual(f.lost, ['62%']); pass++; } catch (e) { fail++; console.log('FAIL facts', f); }
const slop = 'Additionally, this pivotal tool serves as a testament to innovation, showcasing a vibrant tapestry of robust features.';
try { assert(P.score(slop) > P.score(P.run(slop, 2, {}).text)); pass++; } catch (e) { fail++; console.log('FAIL score drop'); }
// diff round trip
const ops = P.diff('a b c', 'a x c');
try { assert.strictEqual(ops.map(o => o.t === '+' ? '' : o.v).join(''), 'a b c'); assert.strictEqual(ops.map(o => o.t === '-' ? '' : o.v).join(''), 'a x c'); pass++; } catch (e) { fail++; console.log('FAIL diff', ops); }
// edge input
for (const s of ['', '   ', '\n\n']) { try { assert.strictEqual(P.run(s).text, ''); pass++; } catch (e) { fail++; console.log('FAIL empty'); } }


// OpenRouter polish, with a stub fetch (no network in tests)
(async () => {
  const calls = [];
  const ok = reply => async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => ({ choices: [{ message: { content: reply(JSON.parse(init.body).messages[1].content) } }], usage: { total_tokens: 42 } }) }; };
  const src = 'Moreover, see https://x.com/a for details. The tool is robust.';
  try {
    const good = await P.polish(src, { key: 'k', fetch: ok(t => t.replace('Moreover, ', '').replace('robust', 'solid')) });
    assert.strictEqual(good.text, 'see https://x.com/a for details. The tool is solid.');
    assert.strictEqual(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.match(calls[0].init.headers.Authorization, /^Bearer k$/);
    assert(!JSON.parse(calls[0].init.body).messages[1].content.includes('https://x.com'), 'URL must be masked');
    assert.strictEqual(good.tokens, 42);
    const bad = await P.polish(src, { key: 'k', fetch: ok(t => t.replace(/__P\d+__/, 'LINK')) });
    assert(bad.warnings.length === 1 && bad.text.includes('https://x.com/a'));
    const err = await P.polish(src, { key: 'k', fetch: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'bad key' } }) }) }).then(() => null, e => e.message);
    assert.match(err, /401.*bad key/);
    const nokey = await P.polish(src, {}).then(() => null, e => e.message);
    assert.match(nokey, /No OpenRouter API key/);
    pass += 4;
  } catch (e) { fail++; console.log('FAIL polish', e.message); }
  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
