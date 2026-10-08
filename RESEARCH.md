# Research notes

Eleven repositories were read. Most are prompts or pipelines that call a language model; Plainspoken adopts only what can run deterministically offline.

| Repository | What it is | Adopted | Not adopted |
|---|---|---|---|
| blader/humanizer (v3.1) | Claude skill, 26 numbered patterns, strongest first | Structural tells: one-line closers, staged run-ups ("Honestly?", "Here's the thing"), arguing with no one, split contrasts, sayings that sound deep, heading restated by the next sentence, hyphen pairs only after the noun, decorative arrows and rules, writing about the document | Rewriting for voice (needs judgement) |
| Aboudjem/humanizer-skill | Skill plus a dependency-free CLI, 0-100 score | The four-signal score (burstiness 0.28, diversity/MATTR 0.18, trigram repetition 0.14, lexical 0.40), its anchors and verdict labels, fact check for numbers/URLs/acronyms | Its LLM rewrite step |
| brandonwise/humanizer | JS analyser, 30 patterns, 500+ word tiers | Tiered vocabulary (always / in clusters / by density), hidden-Unicode removal, safe auto-fixes, burstiness from consecutive length differences, style tips | Suggestion-only mode for most patterns |
| lynote-ai/humanize-text-skill | Bilingual detector and voice layer | Voice fingerprint from a sample (sentence length, spread, connectors, contractions), drift score, "split sentence N" pulls, protected spans, English phrase and structure lists | Its Chinese tokenizer and policy files |
| matsuikentaro1/humanizer_academic | Academic variant plus a stdlib checker | Formal voice: expand contractions, "linked to" to "associated with", "via" to "through", ornamental adverbs, paragraph-rhythm check (all sentences within five words), repeated openers | Passive-voice conversion and synonym swaps (change meaning) |
| op7418/Humanizer-zh | Chinese port of the skill | Chinese stock connectors, scene-setting openers, inflated verbs (赋能, 助力), "不仅仅是X，更是Y" frame | Chinese-specific checks such as stacked "的" |
| rudra496/StealthHumanizer | Next.js app, LLM rewrite then a deterministic layer | The deterministic layer: region protection, dash stripping that keeps numeric ranges, AI-lexicon strip, contraction balancing, readability guard, preamble and wrapping-quote removal, 12-metric detector ideas | The LLM rewrite, random synonym swaps, random punctuation noise, sentence reordering (their own notes say these damaged meaning) |
| lynote-ai/humanize-text | Pipeline: LLM, then Chinese, Japanese, Finnish translation hops | Nothing | Needs an LLM and cloud translation APIs |
| DadaNanjesha/AI-Text-Humanizer-App | Streamlit app, T5 sentence rewriting | Citation placeholder idea (APA regex) | T5 model, spaCy, WordNet, sentence embeddings: all need model downloads |
| DadaNanjesha/AI-content-detector-Humanizer | Streamlit app, transformer detector plus rewriter | Contraction expansion for formal text | Transformer models |
| sanjaysah101/humanize-ai | Next.js app, HuggingFace API | Nothing | Needs a hosted model |

Also used: Wikipedia "Signs of AI writing" (including its note that older tells such as "delve" have faded and that a single transition word is a weak signal) and the 2026 word lists from Forbes, explainx.ai and Olivia Cal.

## Design decisions

- **No random edits.** Several repos randomise swaps to defeat detectors. Plainspoken is deterministic: same input, same output, and every edit is listed.
- **Fidelity first.** Quoted text, citations and numbers are protected, and the fact check reports anything lost.
- **Honest limits.** Items that need specifics or judgement are flagged, not guessed.
