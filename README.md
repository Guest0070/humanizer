# Plainspoken

A text humanizer that runs completely offline. No AI model, no API, no tokens, no network, no dependencies.
It is a rule engine: about 400 deterministic rules, a scoring model, and a diff view, all in plain JavaScript.

## Run it

| What | How |
|---|---|
| App window | Double-click `launch.cmd` (Windows) or run `./launch.sh` (macOS/Linux). It opens `index.html` in an Edge/Chrome app window. |
| Any browser | Open `index.html`. It is one self-contained file. |
| Command line | `node cli.js [options] [file ...]`, or pipe text in. `node cli.js --help` lists the options. |
| Tests | `node tests.js` |
| Rebuild the app | `node build.js` (inlines `src/engine.js` into `src/app.html`, writes `index.html`) |

The page carries a Content-Security-Policy that blocks every network request except `https://openrouter.ai`, and the page only contacts it when you press **Humanize with AI**. With no key entered, it never goes online.

## Optional: AI polish through OpenRouter

Nothing to install. OpenRouter is a plain HTTPS API, so the page (or the CLI) calls it directly with your key.

- **App:** open the "AI polish" section, paste your key, optionally change the model (default `openrouter/auto`), press **Humanize with AI**. The key stays in memory unless you tick "Remember key", which stores it unencrypted in this browser.
- **CLI:** set the key for the current terminal only, then run with `--ai`:
  `$env:OPENROUTER_API_KEY = "sk-or-..."` (PowerShell) then `node cli.js --ai --model openrouter/auto file.txt`. Needs Node 18 or newer.
- **Order:** rules run first, the model rewrites the result, rules run again to catch leftover tells. Code, links, citations, quotes and Keep words are swapped for tokens before sending and verified on return; a part whose tokens come back altered keeps its rule-based text and shows a warning.
- **Cost and privacy:** your text goes to OpenRouter and the model you pick. Leave the key empty and nothing is ever sent.

## What it does

- **Four strengths:** Light (formatting, chatbot debris, filler), Standard (vocabulary, structure, puffery), Aggressive (tails, list labels, sentence splits), Max (rhythm engineering, up to three passes).
- **Five voices:** Neutral, Casual, Direct, Formal (expands contractions, academic habits), Technical (keeps ambiguous words such as "robust").
- **Match my voice:** paste a sample of your own writing. It reads your sentence length, contractions, dashes and connectors, then adapts and reports the distance from your voice.
- **Protects what must not change:** code, links, URLs, emails, @mentions, #hashtags, citations like `(Smith et al., 2023)` and `[1]`, versions, paths, text in double quotes, and any words you list under Keep.
- **Shows its work:** a word-level Changes view, a Tells view that marks every pattern in the original, a per-rule change list, writing stats, and a fact check that lists any number, URL or acronym that went missing.
- **Scores:** a 0-100 AI-tell score from tell density, even rhythm, vocabulary variety and repeated phrases, with a verdict from Pristine to Pure AI smell.
- **Needs a human:** things a program cannot fix honestly (vague attributions, formulaic outlooks, stacked triplets, "not only X but also Y") are flagged for you to rewrite with real specifics.
- **Languages:** English first. A small Chinese and Arabic pass removes stock connectors and chatbot phrases.

## Limits

No tool can guarantee a pass on AI detectors, and the score measures writing habits, not authorship. It cannot add facts, opinions or personality; it removes the habits that read as machine-made and flags the rest. See `RESEARCH.md` for what was adopted from each source repository and what could not be, because it needs a language model.
