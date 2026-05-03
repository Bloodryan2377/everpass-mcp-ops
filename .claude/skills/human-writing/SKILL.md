---
name: human-writing
description: Run BEFORE producing any prose, copy, email, blog post, doc, README narrative, marketing text, social caption, or other piece of writing for the user. Strips the words, phrases, punctuation, and sentence patterns that make AI copy instantly recognizable. TRIGGER on any drafting/rewriting/editing task that produces user-facing prose. SKIP for pure code, terminal commands, JSON, or structured config.
---

# Human Writing Filter

Apply these rules to every sentence you write for the user. Treat the lists as hard bans, not suggestions. If a banned word feels necessary, rewrite the sentence so it isn't.

## Workflow

1. Draft the piece silently.
2. Scan the draft against every list below.
3. Rewrite any line that trips a rule. Do not just swap synonyms — restructure the sentence.
4. Re-read for rhythm. If three sentences in a row open the same way, or paragraphs are suspiciously even in length, break the pattern.
5. Only then return the text.

## Banned verbs

delve, leverage, utilize, harness, unlock, unleash, empower, facilitate, foster, bolster, optimize, streamline, navigate, spearhead, illuminate, elevate, reimagine, revolutionize, craft, embrace, unveil, champion, amplify, augment, enrich, garner, maximize, strive, thrive, uncover

## Banned adjectives

multifaceted, seamless, robust, comprehensive, cutting-edge, holistic, meticulous, groundbreaking, transformative, innovative, vibrant, dynamic, compelling, invaluable, unprecedented, unwavering, game-changing, nuanced, pervasive, thought-provoking, unparalleled, ever-evolving

## Banned nouns

tapestry, realm, testament, beacon, ecosystem, paradigm, synergy, roadmap, journey, cornerstone, bedrock, hallmark, value proposition, pain point, paradigm shift, stakeholders, trajectory, touchpoint

## Banned adverbs

furthermore, moreover, additionally, notably, crucially, seamlessly, meticulously, essentially, fundamentally, undoubtedly, conversely, subsequently

## Banned phrases

- "it's important to note"
- "in today's fast-paced world"
- "let's dive in"
- "at the end of the day"
- "I hope this helps"
- "in conclusion"
- "to summarize"
- "that being said"
- Any sentence opening with "Furthermore" or "Moreover"

## Punctuation rules

- No em dashes (—). Use a period, comma, or parentheses instead.
- No semicolons unless genuinely necessary. Default to two sentences.
- No random bolding for emphasis. Bold only true labels or headers.

## Sentence structure rules

- No self-posed questions answered immediately ("What does this mean? It means...").
- No three sentences in a row starting the same way.
- No trailing summary phrases like "highlighting its importance," "underscoring the value," "showcasing the impact."
- Mix very short sentences with longer ones.
- Never write paragraphs of suspiciously even length.

## Self-check before returning

Run this checklist mentally on the final draft:

- [ ] Zero banned words from any list above
- [ ] Zero banned phrases
- [ ] No em dashes
- [ ] No "question then answer" rhetorical openings
- [ ] Sentence-length variety present
- [ ] Paragraph lengths uneven
- [ ] No filler closers ("I hope this helps," "in conclusion," etc.)

If any box fails, rewrite before delivering.
