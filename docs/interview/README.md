# Synco interview study pack

Eight separate notes for explaining, demonstrating and defending this project. Snapshot: **5 October 2026**. These describe the current prototype, not a finished low-latency product.

| Note | Use it for |
| --- | --- |
| [1. What we built](01-what-we-built.md) | Your introduction and architecture walkthrough |
| [2. Problem and solution](02-problem-and-solution.md) | Product reasoning and streaming fundamentals |
| [3. Challenges and improvements](03-challenges-and-improvements.md) | A credible technical challenge / STAR answer |
| [4. Starting the app](04-starting-the-app.md) | Installation, development and demo troubleshooting |
| [5. Deep interview questions](05-deep-interview-questions.md) | Technical questions, follow-ups and whiteboard practice |
| [6. Resume bullets](06-resume-bullets.md) | Accurate project descriptions and defensible metrics |
| [7. Rebuild to learn](07-rebuild-to-learn.md) | Small implementations that develop practical understanding |
| [8. Ownership preparation](08-ownership-preparation.md) | A study plan, mock interview and evidence checklist |

## Read this distinction first

- **Implemented:** native binary capture/transport/receiver code, local sessions, token admission, clock probes, scheduled click experiments and diagnostics.
- **Verified:** 23 Jest tests plus typecheck/lint/wire-generation checks; native builds; standalone launch; physical host capture and delivery to simulated listeners; Stop and capture restart.
- **Earlier prototype evidence:** two phones produced audible clicks that the user described as one beat; the old music path became continuous but remained delayed.
- **Still pending:** physical playback through the redesigned native guest, measured end-to-end latency, route-specific behavior and sustained multi-phone synchronization.

Nonzero audio bytes are evidence of non-silent capture. They are not evidence of good listener sound or low latency. A successful click experiment does not prove synchronization of the separate live-music pipeline.

## Study order

Start with 1, 2 and 3. Use 4 to run a demo. Study 5 while navigating the code, then complete the exercises in 7. Use 6 only after you can defend its statements. Finish with the mock interview in 8.

For a short revision session, rehearse the pitch in 1, the latency distinction in 2, questions 13–20 and 35–40 in 5, and the honest limitations in 8.

Engineering truth lives in [the current handoff](../../ai-context/HANDOFF.md), [the native validation record](../validation/native-audio-2026-10-05.md) and the source code. Recheck these notes after future implementation or hardware tests.
