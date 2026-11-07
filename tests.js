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
t('article fix', 'It is a stunning, unique view.', 'It is a unique view.');
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
t('student semicolon', 'The model is fast; it is also cheap.', 'The model is fast. It is also cheap.', { voice: 'student' });
t('student openers', 'It works. However, it is slow. Therefore, we stop.', 'It works. But it is slow. So we stop.', { voice: 'student' });
t('student words', 'We obtained sufficient data to demonstrate this.', 'We got enough data to show this.', { voice: 'student' });
t('student expands', "We don't know. It's fine.", 'We do not know. It is fine.', { voice: 'student' });
t('technical keeps robust', 'A robust cache.', 'A robust cache.', { voice: 'technical' });
t('casual however', 'However, we lost.', 'But we lost.', { voice: 'casual' });
t('zh connectors', '在当今数字时代，综上所述，我们赋能企业。', '我们帮助企业。');
t('tail kept in list', 'The aim is clear: streamlining work, enhancing teams, and fostering trust.', /streamlining|simplifying/, {}, 3);
t('ing tail cut', 'The firm opened in 1989, marking a pivotal moment in history.', 'The firm opened in 1989.');

// Refinement pass: damage the benchmark found, each pinned so it cannot come back.
t('article after swap', 'It played a crucial role.', 'It played an important role.');
t('article left alone for h and u', 'An historic win, a unanimous vote, an hour.', 'An historic win, a unanimous vote, an hour.');
t('synonyms collapsed', 'It remains a multifaceted and complex chapter.', 'It remains a complex chapter.');
t('myriad with article', 'It offers a myriad of benefits.', 'It offers many benefits.');
t('range with mass noun', 'They hire a diverse array of talent from abroad.', 'They hire a range of talent from abroad.');
t('range with plural', 'It supports a wide range of use cases.', 'It supports many use cases.');
t('promo before and', 'This library provides a robust and scalable solution.', 'This library provides a scalable solution.');
t('promo predicate kept', 'The view is stunning and the food is great.', 'The view is stunning and the food is great.');
t('noun hype', 'A must-read for fans.', 'Worth reading for fans.');
t('have as possession', 'You have a store. I have a car.', 'You have a store. I have a car.', { register: 'informal' });
t('have as helper', 'We have been there. You have seen it.', "We've been there. You've seen it.", { register: 'informal' });
t('stressed verb kept', 'People who shaped who I am today.', 'People who shaped who I am today.', { register: 'informal' });
t('impersonal keeps register', 'The council does not agree. It is late.', 'The council does not agree. It is late.');
t('academic keeps register', 'Prior work (Smith, 2020) does not agree.', 'Prior work (Smith, 2020) does not agree.');
t('dash before clause', 'Flexibility is a perk — it is not a right.', 'Flexibility is a perk. It is not a right.');
t('no longer contrast', 'Flexibility is no longer a perk — it\'s a necessity.', 'Flexibility is now a necessity, not a perk.');
t('isn\'t just', 'The AuraBrew isn\'t just a coffee maker — it\'s a lifestyle upgrade.', 'The AuraBrew is a lifestyle upgrade.');
t('split contrast', 'Growth isn\'t about hacks. It\'s about people.', 'Growth is about people.');
t('two claims kept', 'Paris isn\'t cheap. It\'s still worth it.', /isn't cheap/);
t('not only but also', 'This shift not only altered living conditions but also gave rise to a new class.', 'This shift altered living conditions and gave rise to a new class.');
t('rider with a fact kept', 'Sales rose, contributing to a 20% rise in profit.', 'Sales rose. This contributed to a 20% rise in profit.');
t('rider made a sentence', 'The library is compatible with TypeScript, ensuring type safety throughout your app.', 'The library is compatible with TypeScript. This ensures type safety throughout your app.', {}, 3);
t('rider past tense', 'The engine played a role, enabling factories to run faster and paving the way for mass production.', 'The engine played a role. This enabled factories to run faster and opened the way to mass production.', {}, 3);
t('empty rider cut', 'We rebuilt the cache, ensuring success.', 'We rebuilt the cache.', {}, 3);
t('enumerated list untouched', 'Our work has three parts: (i) a design, (ii) a proof, and (iii) tests on 12 sets, demonstrating strong results.', /demonstrating strong results/, {}, 3);
t('participle after have', 'LSTMs have demonstrated strong results.', 'LSTMs have shown strong results.', { voice: 'student' });
t('heading sentence case', '# The Future Of Remote Work: Navigating A New Era\n\nText.', '# The future of remote work: navigating a new era\n\nText.');
t('heading keeps names', '## Working In London Today\n\nI moved to London in May.', '## Working in London today\n\nI moved to London in May.');
t('numbered heading', '## 1. Prioritize Your Tasks\n\nText.', '## 1. Prioritize your tasks\n\nText.');
t('short line after heading kept', '## Notes\n\nWe met in London.', '## Notes\n\nWe met in London.');
t('preamble after opener', 'Certainly! Here\'s a blog post about remote work:\n\nRemote work grew.', 'Remote work grew.');
t('please hesitate', 'Thanks. Please don\'t hesitate to reach out. I am around.', 'Thanks. I am around.', { contractions: false });
t('email pleasantry', 'Hi Sam,\n\nI hope this email finds you well! I wanted to take a moment to ask about Q3.', 'Hi Sam,\n\nI wanted to ask about Q3.');
t('consecutive drops', 'Focus wins. That\'s the real lesson. Let that sink in. Ship it.', 'Focus wins. Ship it.');
t('question praise', 'Choosing X is a great question, and the answer depends on your goals.', 'Choosing X depends on your goals.');
t('next level', 'You can take your productivity to the next level.', 'You can improve your productivity.');
t('unlock potential', 'Teams can unlock their full potential.', 'Teams can reach their full potential.');
t('robust statistics kept', 'We used robust standard errors.', 'We used robust standard errors.');
t('dot word kept', '- **.docx in and out:** open a file.', '- .docx in and out: open a file.');
t('code inside protects tex', 'Use `\\cite` and `\\ref` here.', 'Use `\\cite` and `\\ref` here.');
t('echo after swap', 'Output quality has been enhanced through improved training.', 'Output quality has been improved through better training.');
{
  const n = P.score('Experts say it works.');
  try { assert(n < 80, n); pass++; } catch (e) { fail++; console.log('FAIL short score', n); }
}
t('label kept when not restated', '- **Four strengths:** Light, Standard, Aggressive and Max levels.', '- Four strengths: Light, Standard, Aggressive and Max levels.', {}, 3);
{
  const f = P.findFlags('You ship. Then another. Then another. Nothing moves.');
  try { assert(f.some(x => /dramatic fragments/.test(x.label))); pass++; } catch (e) { fail++; console.log('FAIL fragment flag', JSON.stringify(f)); }
}
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



// Merged ruleset reaches the model as the system prompt; the key never does
(async () => {
  try {
    let seen;
    const grab = async (url, init) => { seen = JSON.parse(init.body); return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) }; };
    await P.polish('Some text.', { key: 'SECRET-KEY-123', fetch: grab, voice: 'formal', sample: 'I write plain words and short lines. '.repeat(10) });
    const sys = seen.messages[0].content;
    for (const needle of ['A. Staging instead of stating', 'F. Wrong reader', 'Final self-check', 'Never add or drop a fact', 'Not X but Y', 'One-line closers', 'Forced triads', '__P0__', 'Formal and academic', 'It overrides the rules above, including the dash rule'])
      assert(sys.includes(needle), 'prompt missing: ' + needle);
    assert(!JSON.stringify(seen).includes('SECRET-KEY-123'), 'key must not appear in the request body');
    await P.polish('Some text.', { key: 'k', fetch: grab });
    assert(!seen.messages[0].content.includes('writing sample'), 'no sample section without a sample');
    pass++;
  } catch (e) { fail++; console.log('FAIL system prompt', e.message); }
})();


// LaTeX protection, docx round trip, word target
t('latex math kept', 'Moreover, $x = y^2$ holds, so we leverage it.', '$x = y^2$ holds, so we use it.');
t('latex cite kept', 'We leverage prior work \\cite{smith2020} and Fig.~\\ref{fig:a}.', 'We use prior work \\cite{smith2020} and Fig.~\\ref{fig:a}.');
t('latex env kept', 'We leverage this:\n\\begin{equation}\na + b = c\n\\end{equation}\nMoreover, it works.', 'We use this:\n\\begin{equation}\na + b = c\n\\end{equation}\nIt works.');
t('latex comment kept', '% Moreover, TODO leverage\nWe leverage it.', '% Moreover, TODO leverage\nWe use it.');
t('currency is not math', 'We leverage $5 or $10 budgets.', 'We use $5 or $10 budgets.');
t('percent in prose', 'We leverage it in 62% of cases.', 'We use it in 62% of cases.');
(async () => {
  try {
    const src = '# Title\n\nFirst paragraph with <angle> & "quotes".\n\n- item one\n- item two\n\nLast one.';
    const back = await P.readDocx(P.writeDocx(src));
    assert.strictEqual(back, src);
    // A deflate-compressed archive, as Word writes it
    const zlib = require('zlib');
    const xmlDoc = '<w:document><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Intro</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Hello </w:t></w:r><w:r><w:t>world &amp; more.</w:t></w:r></w:p></w:body></w:document>';
    const data = zlib.deflateRawSync(Buffer.from(xmlDoc)), name = Buffer.from('word/document.xml');
    const le = (n, b) => { const x = Buffer.alloc(b); x.writeUIntLE(n, 0, b); return x; };
    const local = Buffer.concat([le(0x04034b50, 4), le(20, 2), le(0, 2), le(8, 2), le(0, 4), le(0, 4), le(data.length, 4), le(xmlDoc.length, 4), le(name.length, 2), le(0, 2), name, data]);
    const cen = Buffer.concat([le(0x02014b50, 4), le(20, 2), le(20, 2), le(0, 2), le(8, 2), le(0, 4), le(0, 4), le(data.length, 4), le(xmlDoc.length, 4), le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(0, 4), name]);
    const eocd = Buffer.concat([le(0x06054b50, 4), le(0, 2), le(0, 2), le(1, 2), le(1, 2), le(cen.length, 4), le(local.length, 4), le(0, 2)]);
    assert.strictEqual(await P.readDocx(Buffer.concat([local, cen, eocd])), '# Intro\n\nHello world & more.');
    await P.readDocx(Buffer.from('not a zip at all, just text padding'.repeat(3))).then(() => assert.fail('should reject'), e => assert.match(e.message, /Not a \.docx/));
    pass++;
  } catch (e) { fail++; console.log('FAIL docx', e.message); }
  try {
    const seen = [];
    const grab = async (u, init) => { seen.push(JSON.parse(init.body).messages[0].content); return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) }; };
    await P.polish('word '.repeat(60) + '\n\n' + 'more '.repeat(60), { key: 'k', fetch: grab, targetWords: 100, chunkChars: 400 });
    assert(seen.length === 2 && seen.every(x => /about 50 words/.test(x)), seen.map(x => (x.match(/about \d+ words/) || ['none'])[0]).join());
    await P.polish('hello there', { key: 'k', fetch: grab });
    assert(!/Length: this part/.test(seen[seen.length - 1]));
    pass++;
  } catch (e) { fail++; console.log('FAIL target words', e.message); }
})();

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
