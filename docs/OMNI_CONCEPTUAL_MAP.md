# Omni — Conceptual map

Companion brainstorm note for `CANVAS_C_UNIVERSAL_TUTOR_DESIGN.md`. This one is **structural, not implementation**. It locks the layer model and naming. Read this first, then the Canvas C design doc for the build details of the Omni shell.

---

## The shape

A **router** at the front. Student says anything. Router decides which mode best serves the request and invokes it. Modes are interchangeable — the router can switch mid-session if needed.

- **Omni** = the router + the conversational layer the student talks to.
- **Modes** = the specialized tools Omni invokes when a particular shape of help is best.

Omni is the brain. Modes are the hands.

---

## Naming frame

Three viable framings. Pick one and stick:

| Frame | What you call modes | Vibe |
|---|---|---|
| **Action-first** | `Walkthrough`, `Practice`, `Converse`, `Solve`, `Visualize` | Functional, plain |
| **Persona-first** | `Lecturer`, `Coach`, `Companion`, `Solver`, `Illustrator` | Warmer, characterful |
| **Letter-first** (current) | `Mode A`, `Mode B`, `Mode C`, … | Engineer-internal, opaque to users |

Recommendation: switch to **action-first** while the surface is still small. Letters get unintelligible past three modes.

---

## Mode taxonomy — five is plenty

| # | Mode (action-first name) | What it does | Status |
|---|---|---|---|
| 1 | **Walkthrough** | Author-led narration of a known lesson. Linear, polished, audio-rich. | ✅ Built (was Canvas A Mode 1) |
| 2 | **Practice** | Step-by-step Q-each-step on a known problem. Tutor checks each answer, coaches forward. | ✅ Built (was Canvas A Mode 2) |
| 3 | **Converse** | Open-ended voice/text on anything. Persistent canvas, plan tree, no pre-authored spine. | 🟡 Designed (Canvas C doc) |
| 4 | **Solve** | Problem-shaped input ("here's a problem, work it with me"). Different from Practice — Practice has a known canonical solution path; Solve does not. | ⚪ Future |
| 5 | **Visualize** | "Show me this." Generates a diagram, animation, or simulation as a standalone artifact, not a full lesson. | ⚪ Future |

**Things that are NOT modes** (they're capabilities, shared by all modes):
- Image generation, simulation, audio narration, Wikipedia lookup, math rendering, voice in/out.

Keep modes few and well-distinguished. Capabilities can multiply freely.

---

## Three patterns for how Omni invokes modes — only one is right

| Pattern | Description | Verdict |
|---|---|---|
| **A — Modal switch** | Student picks mode upfront. Modes are siloed surfaces. | ❌ What we have today. Doesn't scale past 3 modes. Forces the student to know what they need. |
| **B — Router-then-handoff** | Omni picks a mode, hands off entirely. Mode runs to completion, returns to Omni. | 🟡 Better, but loses continuity. Mode-switching mid-flow is jarring. |
| **C — Omni-as-host, modes-as-skills** | Omni stays in charge of the session. Modes are **operations** Omni invokes inline, like tool calls. Walkthrough becomes "play this lesson inline"; Practice becomes "drop into Q-each-step for a few rounds, then return"; Visualize becomes "render this diagram in the sidebar." | ✅ **Right answer.** |

So: **Omni is the only tutor the student talks to.** Modes are how it accomplishes specific shapes of work, similar to how a real tutor sometimes switches into "let me walk you through this carefully" voice and sometimes into "let's do practice problems" voice — same person, different operating mode.

This means **Canvas C (the conversational shell) is Omni.** It's not a sibling of A and B; it's their parent.

---

## What this means for existing Mode 1 (Walkthrough) and Mode 2 (Practice)

Today they're **standalone surfaces** the student lands in directly. After this restructure:

- They become **callable operations** Omni invokes mid-session.
- Their existing standalone URLs keep working — for direct deep-links, embeds, partner integrations:
  - Walkthrough: `canvasa.physolympiad.com/tutor?lesson=<slug>`
  - Practice: `canvasa.physolympiad.com/guide?lesson=<slug>`
- Primary student journey runs through Omni.

Concretely:
- Student says "teach me Bohr's atom" → Omni sees a lesson exists in cache → invokes Walkthrough inline → narration plays inside Omni's canvas, plan tree updates. Lesson ends → conversation continues in Omni.
- Student says "let me try a problem" mid-lesson → Omni invokes Practice for a few rounds → returns control.
- Student says "I don't get it, can you draw it?" → Omni invokes Visualize → diagram appears in the sidebar.

Student doesn't see a mode switch. They see one tutor that adapts.

---

## Layer diagram

```
                          STUDENT
                             │
                             │  text / voice
                             ▼
          ┌──────────────────────────────────────────┐
          │                  OMNI                    │
          │    (router + conversational shell)       │
          │                                          │
          │   - Owns session, plan, canvas           │
          │   - Picks the right operation per turn   │
          │   - Holds the conversation thread        │
          └────────────────┬─────────────────────────┘
                           │ invokes
        ┌──────────┬───────┼───────┬──────────┬───────────┐
        ▼          ▼       ▼       ▼          ▼           ▼
   Walkthrough  Practice  Solve  Visualize  Converse  …future
   (Mode 1)    (Mode 2)                    (default
                                            shell talk)
                           │
                           ▼ all share
              ┌────────────────────────────┐
              │ Capabilities (tool layer)  │
              │  - LLM (Claude)            │
              │  - TTS (ElevenLabs + fb)   │
              │  - ASR (Whisper)           │
              │  - Diagrams (TikZ/Mermaid) │
              │  - Math (KaTeX)            │
              │  - Retrieval (Wikipedia)   │
              │  - Image gen (later)       │
              │  - Simulation (later)      │
              └────────────────────────────┘
```

Three layers: **Omni** (one), **Modes** (few), **Capabilities** (many, shared).

---

## Three structural decisions to lock before Omni build starts

1. **Naming frame.** Action-first / persona-first / letter-first.
2. **Omni's relationship to modes.** Pattern C (modes-as-skills) is the recommendation; needs explicit confirmation since it's a meaningful architectural choice.
3. **Where Omni lives.** Recommendation: `tutor.superstem.ai` is Omni's home. Olympiz / SuperStem / Fermi can each embed Omni with their own subject scope + theme — same Omni, different shells. Or keep Omni universal-only and verticals stick with direct mode invocations.

Once those three are settled, the Omni agent can move to `CANVAS_C_UNIVERSAL_TUTOR_DESIGN.md` and start building.

---

## Division of labor (so two agents don't collide)

- **Omni agent** owns: this map, the Canvas C design doc, `tutor.superstem.ai` build, the router, plan/canvas state, mode-as-skill invocation contract.
- **Canvas A agent (canvas-a backend)** owns: making Walkthrough and Practice rock-solid as standalone modes — quality of the existing flows, content authoring pipeline, audio reliability, eval harness. Does NOT touch Omni.
- **Boundary:** Walkthrough and Practice expose themselves to Omni via stable URLs (already exist) plus, eventually, an inline-embed contract (TBD when Omni starts building Phase 2). Until then, full-page invocation is fine.

This way the two tracks proceed in parallel without stepping on each other.
