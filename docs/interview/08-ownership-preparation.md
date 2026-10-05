# 8. How to become confident in owning Synco

Confidence comes from being able to **explain, modify, debug and verify** the application. Memorized architecture answers help with introductions; small independent implementations and honest evidence make follow-up answers convincing.

## A seven-session study plan

Treat each session as a milestone, not a fixed number of hours. Repeat difficult sections until you can explain them without notes.

| Session | Do this | Produce this evidence |
| --- | --- | --- |
| 1: Product | Read notes 1–2; explain source-app control and the host-output limitation | A recorded 90-second pitch and one architecture sketch |
| 2: Contract | Recreate the binary codec and review malformed-input behavior | Passing boundary/negative tests and a labeled packet |
| 3: Time | Recreate offset estimation and probe readiness | A worked timestamp example and an asymmetry explanation |
| 4: Streaming | Build the queue simulation and trace PCM through Kotlin | Occupancy/delay results and a list of real buffer policies |
| 5: Lifecycle | Trace Start/Stop/Leave and stale callback handling | A state-transition diagram and three race scenarios |
| 6: Demo | Install/launch the app and run the available checks | A reproducible procedure and limitations statement |
| 7: Interview | Answer random questions and explain one code change | A mock interview score and a targeted revision list |

The second phone is not necessary for sessions 1–5. Use existing evidence for claims you cannot currently reproduce. Schedule physical validation only when the device is available.

## Keep a personal evidence ledger

For each important claim, record these four fields:

| Claim | Where implemented | How checked | Remaining uncertainty |
| --- | --- | --- | --- |
| Audio frames avoid JS in new path | Native host/guest modules | Code trace and host binary smoke | Physical guest behavior |
| Sessions reject wrong tokens | Admission/service code | Simulated wrong-token test | Wider abuse/security testing |
| Stop ends host capture | Capture/service lifecycle | Physical release Stop checks | More failure/race scenarios |
| Users hear audio together | Product goal | Earlier subjective click result only | Native music acoustics and route variation |

Use [the validation record](../validation/native-audio-2026-10-05.md) as the starting evidence, not memory. “Not yet measured” is a strong answer when followed by a precise test plan.

## Learn to navigate the code live

Practice these without searching every line:

- Start at the Share button and find the action, service call and native capture entry point.
- Locate the selected source-app package/UID filter and explain compatibility limits.
- Find the packet contract, native generation step and receive-side validator.
- Find the host queue, receiver startup cushion and overflow behavior.
- Follow Stop through control propagation, capture teardown and guest output cleanup.
- Show why clock readiness is not the same as live-music synchronization.

For every file you open, say what it owns and what it delegates. That is more useful than reciting class names.

## Practice one small change independently

Pick an exercise such as a protocol boundary test or a clearer diagnostic counter. Write a short intention, implement it on a practice branch, run the relevant check and explain the diff. For actual project code changes, run `npm run check` and perform native/device validation when affected.

Avoid changing buffer constants merely to create a performance story. A legitimate improvement needs a hypothesis and a result that could prove it wrong.

## A five-minute demo structure

1. **Problem, 30 seconds:** two people, one source, separate earphones; host keeps their usual music app controls.
2. **Architecture, 60 seconds:** control path versus native audio path, with one packet's journey.
3. **Working evidence, 90 seconds:** standalone launch and available test/demo. Use simulated-host evidence transparently if the second phone is absent.
4. **Challenge, 60 seconds:** breakup versus delay, native redesign, bounded queues and the remaining measurement gate.
5. **Next step, 60 seconds:** physical receiver validation, controlled latency measurement and route comparisons.

Have the current APK and notes available locally. Do not rely on a live source app fetching music over unreliable internet. Use a permitted test source when possible, and identify any difference from the currently configured source.

## Mock interview rubric

Score each area 0–2: **0** cannot explain, **1** explains with prompts, **2** explains and handles a follow-up.

| Area | Test yourself |
| --- | --- |
| Product | Why capture instead of building a player? |
| Architecture | Where do control and PCM paths diverge? |
| Audio | Calculate chunk size and explain partial writes. |
| Time | Derive offset and distinguish clock time from output time. |
| Network | Explain TCP stalls and application sequence gaps. |
| Lifecycle | Trace a late callback after Stop/restart. |
| Security | Explain token admission versus encryption. |
| Evidence | State precisely what is tested and pending. |
| Debugging | Diagnose continuous-but-late audio without guessing. |
| Ownership | Explain one change you implemented and verified yourself. |

A score is a study tool, not a hiring prediction. Revisit every zero before adding more resume claims.

## Answers to difficult ownership questions

**“Did AI write this?”**

Explain the actual workflow. AI helped implementation and debugging; you supplied the product goal, constraints and device feedback. Name the modules you have now studied or rebuilt. Do not hide assistance, and do not equate generated code with knowledge you have not yet acquired.

**“Is it finished?”**

> It is an Android prototype. Host capture and native binary delivery have been validated, while real-device receiver playback and latency measurement are still pending. I can show the current evidence and the next acceptance tests.

**“Why hasn't latency been solved?”**

> We removed avoidable conversions and bounded application queues, but we still need to measure the full capture-to-speaker path. The original source playback is outside Synco's scheduling control, and output routes add delay. I would separate those causes before selecting the next optimization.

**“What don't you know?”**

Name a concrete uncertainty, such as native guest performance on a Bluetooth route. Then describe how you would measure it. Avoid inventing a confident answer to a hardware-specific question.

## Keep the next roadmap narrow

The immediate sequence is physical guest playback, acoustic measurement, evidence-led buffer tuning, listener timeline/drift experiments and lifecycle improvements. Broad source compatibility, background receiver behavior and protected transport need explicit design and validation before wider release. A new codec or network protocol should answer a measured need.

Your strongest ownership demonstration is a small, correct change you can explain from user action to test evidence.
