# Canvas C — Universal Tutor · Design document

**Audience:** the agent who will build this.
**Mission:** ship a universal, conversational AI tutor at **`tutor.superstem.ai`** that can teach a student anything — physics, history, languages, music theory, code, anything — in a real-time, voice-capable, board-driven session.

This is the third tutor mode after Canvas A (*"You teach, I learn"* — narrated walkthrough) and Canvas B / Mode 2 (*"You guide, I do it"* — interactive Q-each-step). Canvas C is fundamentally different: the spine is **emergent**, not pre-authored. Tutor and student co-author a session in real time.

---

## 1. What we're building

A web app at `https://tutor.superstem.ai` with two surfaces:

**1.1 Home (`/`)** — the front door:
- Hero: *"What do you want to learn?"*
- Big text input + Start button
- 4–8 quick-start chips spanning subjects (e.g. "Krebs cycle", "Photosynthesis", "Russian verbs", "Octave theory") — to communicate range
- "Continue" list for signed-in users (recent sessions)
- That's the page. Nothing else. Same instinct as ChatGPT/Claude/Perplexity homes.

**1.2 Session (`/session/<id>`)** — the runtime:
- Three-pane layout (board · sidebar · bottom strip), described in §4.
- Full viewport, no nav chrome.

When the user clicks Start on home, the URL becomes `/session/<id>`. Going back to `/` loses the session unless signed-in (or autosaved to localStorage for anonymous users).

---

## 2. Where it lives — and what it reuses

### Domain
**`tutor.superstem.ai`** — subdomain of the existing superstem.ai. No new domain to manage right now. The product is positioned as Meraki Labs' universal tutor; it sits under SuperStem for hosting convenience but is brand-distinct.

### Reuse — this is most of the work, already done

| What | Where | Use as-is |
|---|---|---|
| **React component package** | [`@canvasa/tutor-react`](https://github.com/mukesh-bansal/canvasa-tutor-react) (public) | Theming via CSS variables, `<LessonModeModal>`, `<TutorButton>`, axios client to canvas-a |
| **Backend Tutor Engine** | EC2 `~/canvas-a/scripts/server.py` (FastAPI on port 8768) | Claude reasoning, Whisper ASR (`whisper_transcribe`), ElevenLabs TTS w/ primary→secondary key fallback (`elevenlabs_synth` / `_elevenlabs_synth`), tenant model |
| **Wikipedia retrieval** | `/api/wiki-opensearch?q=…` | Already wired, used by Canvas A source picker |
| **Audio infra** | `/canvas-audio/_*/<id>.mp3` static mount + CORS allow-all | Plays cross-origin into the React app |
| **Tenant scoping** | `_BRAND_THEMES` dict in server.py (olympiz, superstem, fermi) | Add a new tenant `'open'` for the universal tutor |
| **CSS theming** | `tutor.css` in tutor-react package | Override `--tutor-*` CSS variables for the Universal Tutor brand accent (see §10) |
| **API client + types** | `src/services/tutorApi.ts` in tutor-react | Reuse + extend with new `/api/conversation/*` endpoints |

### What's genuinely new

- **Agent orchestration loop** — Claude with tools, multi-turn, streaming.
- **Persistent canvas state** — append-only blocks, scrollback memory.
- **Plan tree** — emergent study plan that updates as the convo unfolds.
- **Voice conversation channel** — PTT mic, ASR, streaming TTS, barge-in (Phase 5).
- **Broader block renderers** — code, image, table, timeline, music notation (Phase 4).
- **Per-user notebook** — sign-in, persistent sessions (Phase 3).

---

## 3. Architectural shape

```
                        ┌───────────────────────────────┐
                        │  Tutor Engine (canvasa)        │
                        │  /api/conversation/*           │
                        │  Claude tool-loop              │
                        │  ElevenLabs TTS + fallback     │
                        │  Whisper ASR                   │
                        │  Wikipedia retrieval           │
                        └───────────────────────────────┘
                                       ▲
                                       │ HTTPS
                                       │
        ┌──────────────────┬───────────┴──────────────────┐
        │                  │                              │
   olympiz.ai          superstem.ai              tutor.superstem.ai
   (physics scope)     (STEM scope)              (open scope) ← THIS
        │                  │                              │
        └────────────── @canvasa/tutor-react ─────────────┘
                       (one shared package)
```

The universal tutor is the **4th host** of the same infrastructure. Same React package, same backend, **wider tool palette + no subject constraint in the system prompt + new home page**.

---

## 4. UX — the 3-pane runtime

```
┌──────────────────────────────────────┬─────────────────┐
│                                      │                 │
│  BOARD (≈ 2/3 width)                 │  SIDEBAR (1/3)  │
│  ──────────────                      │  ─────────────  │
│  Persistent, scrollable.             │  • Plan tree    │
│  Tutor appends blocks                │    ✓ covered    │
│  (text · math · code · image ·       │    → in prog    │
│  table · timeline · diagram ·        │    ◯ queued     │
│  quiz card) as the convo evolves.    │                 │
│  Latest block auto-scrolls into      │  • Diagrams     │
│  view unless user scrolled up.       │    pushed by    │
│  Old blocks remain readable —        │    tutor or     │
│  this is a chalkboard that doesn't   │    pulled by    │
│  get erased.                         │    student      │
│                                      │                 │
│                                      │  • References   │
│                                      │    (Wikipedia,  │
│                                      │    quoted)      │
├──────────────────────────────────────┴─────────────────┤
│  TRANSCRIPT (live subtitles, last ~3 lines)            │
│  ─────────────                                         │
│  [🎙 hold to speak] [text input        ] [send]        │
│                                                        │
│  Suggested next:                                       │
│  [ Why does that work? ]  [ Show diagram ]             │
│  [ Skip ahead ]            [ Quiz me ]                 │
└────────────────────────────────────────────────────────┘
```

### Bottom strip — three stacked rows
1. **Live subtitles** — last 3 lines of transcript, auto-scrolls. Helps non-listeners + accessibility.
2. **Input row** — PTT mic button (Phase 5), text input, send. Mic is hold-to-talk.
3. **Suggestion chips** — dynamic. The tutor proposes 2–4 next actions per turn (chosen by Claude, returned via the `suggest_next(chips)` tool call). Click a chip → it's sent as the student's next message.

### Sidebar
- **Plan tree** at the top: hierarchical (modules → steps), collapsible, shows status icons.
- **Diagrams / references** below: most-recent-first.
- **Toggle**: collapse to hidden on mobile.

### Board
- **Append-only**. Tutor never erases.
- **Auto-scroll** to latest block, **unless** the user has scrolled up — then a "Jump to latest" pill appears.
- **Block types** (Phase 2 minimum + Phase 4 expansion — see §7).

### Voice states (visible in the UI)
- `idle` — input ready
- `listening` — mic active, waveform animating
- `thinking` — tutor is reasoning (Claude tool loop in progress)
- `speaking` — tutor is uttering, TTS playing; transcript subtitles flowing

---

## 5. State model

```ts
type Session = {
  id: string;
  topic: string;             // "Teach me kinematics"
  user_id: string | null;    // null if anonymous (localStorage-backed)
  tenant: 'open';            // always 'open' for universal tutor
  created_at: ISO8601;
  updated_at: ISO8601;

  plan: PlanNode[];          // hierarchical, mutable
  canvas: CanvasBlock[];     // append-only, ordered
  transcript: Turn[];        // student + tutor utterances
  understanding: Record<string, number>;  // concept → 0..1 confidence

  pending: PendingIntent | null;  // what tutor is about to do; allows interrupt
  voice_state: 'idle' | 'listening' | 'thinking' | 'speaking';
};

type PlanNode = {
  id: string;
  title: string;
  status: 'covered' | 'in_progress' | 'queued' | 'suggested' | 'skipped';
  origin: 'initial_plan' | 'student_question' | 'tutor_branch';
  children?: PlanNode[];
};

type CanvasBlock = {
  id: string;
  ts: ISO8601;
  kind: 'text' | 'math' | 'code' | 'image' | 'table' | 'list' |
        'timeline' | 'diagram' | 'quiz' | 'callout' | 'reference';
  content: any;              // shape varies per kind; see §7
  plan_node_id?: string;     // link to plan
};

type Turn = {
  id: string;
  role: 'student' | 'tutor';
  modality: 'voice' | 'text';
  text: string;
  audio_url?: string;
  ts: ISO8601;
};
```

**Persistence**:
- Anonymous: full Session in localStorage, no server-side store.
- Signed-in: server-side storage (Postgres or SQLite), session list visible on home.

---

## 6. The agent loop — Claude with tools

Single Claude **Sonnet** call per turn, tool-using, with full session state in context (truncated to last ~15 turns + plan summary).

### System prompt (sketch)

```
You are an open-domain tutor. The student wants to learn {topic}.

Your tools let you:
- speak to the student (say)
- add blocks to the board (add_block of various kinds)
- update the sidebar (update_sidebar)
- modify the running study plan (update_plan)
- look up facts on Wikipedia (lookup_fact)
- pause to let the student respond (wait_for_student)
- propose next-step chips for the student (suggest_next)

Principles:
- Co-author with the student. They drive direction. Follow their questions.
- Use the board to anchor key ideas. Don't dump walls of text.
- Surface a diagram or example when an idea is visual or procedural.
- Track understanding implicitly — don't move on if the student is confused.
- Be terse. Speak like a real tutor, not an essay.
- When uncertain about a fact, call lookup_fact.

The student just said: "{transcript}"
```

### Tool palette (v0)

| Tool | Args | Effect |
|---|---|---|
| `say(text)` | text | TTS via ElevenLabs; appended to transcript |
| `add_block(kind, content, plan_node_id?)` | block | Append to canvas |
| `update_sidebar(item)` | item | Push to sidebar (diagram / reference / plan highlight) |
| `update_plan(op, args)` | `op: 'init' \| 'mark_covered' \| 'insert_after' \| 'skip' \| 'branch'` | Mutate plan tree |
| `lookup_fact(query)` | query | Calls `/api/wiki-opensearch?q=…` + returns first 2 results to Claude |
| `suggest_next(chips)` | `chips: string[]` (2–4) | Render suggestion chips in bottom strip |
| `wait_for_student()` | — | End turn; show input ready |
| `quiz(question, expect)` | { mc \| free \| numeric } | Render a quiz card; student must answer to continue |

Per turn, Claude streams tool calls. Frontend renders each as it lands; TTS plays as `say()` lands. Loop.

### Turn lifecycle

1. Student speaks (or types) → frontend POSTs to `/api/conversation/<sid>/turn` with `{text, modality}`.
2. Backend appends to transcript, packages context (plan summary + last 15 turns + last 5 canvas blocks), calls Claude with tools.
3. Claude streams a sequence of tool calls. Each tool call is executed server-side (e.g. `say()` synth-es audio + writes to canvas-audio/, `add_block()` persists, `lookup_fact()` queries Wikipedia).
4. Frontend receives each tool result via SSE or polling, applies to UI immediately.
5. When Claude calls `wait_for_student()` or runs out of tool calls, turn ends, voice state → `idle`.

---

## 7. Block renderer set

### Phase 2 (v0 minimum — text-only modalities still rich)
- `text` — `{ markdown: string }`. Render with markdown-it + KaTeX.
- `math` — `{ latex: string, display: 'inline' | 'block' }`. KaTeX.
- `code` — `{ lang: string, code: string }`. Syntax-highlighted (prism / shiki).
- `image` — `{ url, alt, caption? }`. Hosted images.
- `table` — `{ headers: string[], rows: string[][] }`. Plain HTML.
- `list` — `{ ordered: bool, items: string[] }`.
- `callout` — `{ kind: 'tip' | 'warn' | 'fact', text }`.
- `reference` — `{ source: 'wikipedia', title, snippet, url }`. Pinned to sidebar.

### Phase 4 (subject-rich)
- `timeline` — `{ events: [{date, title, body}] }`. Vertical or horizontal.
- `diagram` — `{ kind: 'tikz' | 'mermaid' | 'svg', spec: string }`. Reuse Canvas A's TikZ.
- `music_staff` — `{ vexflow_spec }`. VexFlow.
- `tree` — `{ nodes }`. Generic tree (taxonomy, family tree, AST).
- `map` — `{ lat, lng, zoom, pins }`. Leaflet.
- `quiz` — `{ kind: 'mc' | 'free' | 'numeric', question, options?, correct? }`. Inline check.

---

## 8. Audio / voice

### TTS
- Reuse canvas-a's `elevenlabs_synth(text)` (with primary → secondary key fallback already wired).
- Each `say(text)` tool call hits this and writes `/canvas-audio/_conv/<sid>/<turn_id>.mp3`.
- Frontend `<audio>` element auto-plays as URLs land.

### ASR (Phase 5)
- Reuse canvas-a's `whisper_transcribe(audio_bytes)`.
- Frontend records via MediaRecorder (PTT). On release, POSTs blob to `/api/conversation/<sid>/asr`. Backend transcribes, appends to transcript as a student turn, kicks off the agent loop.

### Streaming + barge-in (Phase 5.5)
- For voice convo to feel real, add: streaming TTS (chunked playback), barge-in (when student starts speaking, tutor stops mid-utterance).
- Out of scope for v0/v1.

---

## 9. Knowledge sources

- **Floor**: Claude Sonnet's training. Broad, but stale + may hallucinate dates/citations.
- **Tool**: `lookup_fact(query)` — calls `/api/wiki-opensearch?q=…`, returns top 2 hits with summary. Claude is prompted to call this whenever it's about to assert a date / proper noun / specific fact.
- **Future** (Phase 6+): subject-specific corpora (LSAT prep, music theory, code execution sandbox, math problem banks).

For v0 — Claude + Wikipedia is sufficient. Don't over-engineer retrieval.

---

## 10. Tenant + theming

Add a 4th tenant: `open`.

Backend (`server.py`'s `_BRAND_THEMES`):
```py
"open": {
    "sub": "tutor.superstem.ai",
    "css": "",  # no overrides; uses default CSS variables
}
```

Frontend (`tutor.superstem.ai`):
```tsx
configureTutor({
  host: 'https://canvasa.physolympiad.com',
  tenant: 'open',
});
```

CSS variable override on the tutor.superstem.ai root (a fresh accent — not gold like olympiz, not forest like superstem-stem):

```css
:root {
  --tutor-bg:           #fbfaf6;       /* cream */
  --tutor-surface:      #ffffff;
  --tutor-text:         #1a1a2e;
  --tutor-muted:        #4a4a5a;
  --tutor-border:       #e7ecf3;
  --tutor-accent:       #5b4fc7;       /* violet/indigo — distinct from gold/forest */
  --tutor-accent-strong:#3a2fa0;
  --tutor-accent-soft:  rgba(91,79,199,0.10);
  --tutor-primary:      #14213d;
  --tutor-on-primary:   #ffffff;
  --tutor-font-display: 'Playfair Display', Georgia, serif;
  --tutor-font-body:    Inter, -apple-system, sans-serif;
}
```

Indigo-violet feels broad/scholarly — less STEM-coded than gold/forest. Open to alternatives.

---

## 11. Build phases

| Phase | Scope | Time | Deps |
|---|---|---|---|
| **0 — Brand & home** | Subdomain DNS, home page (hero + input + Start + 4 quick-starts), basic CSS-variable theme, anonymous Session creation in localStorage. Routes to `/session/<id>` with no agent yet. | 1–2 days | DNS access |
| **1 — Static Canvas C runtime** | 3-pane React layout, fake transcript, fake plan tree, fake board blocks. Renders all Phase-2 block types. No backend. | 2 days | none |
| **2 — Single-turn agent loop** | New `/api/conversation/*` routes. POST turn → Claude with tool palette → stream tool calls → frontend renders. Text-only. Phase-2 block types only. Wikipedia tool. ElevenLabs `say()`. | 4 days | Phase 1 |
| **3 — Multi-turn + plan tree** | Plan generation on first turn, mark-covered logic, branching, persistent canvas, scrollback memory in context window, /session/<id> reload restores Session from localStorage. | 1 week | Phase 2 |
| **4 — Identity + saved notebooks** | Google sign-in (reuse the OAuth flow olympiz.ai uses; same `VITE_GOOGLE_CLIENT_ID`). Server-side Session storage (SQLite is fine for v0). "Continue" list on home. | 4 days | Phase 3 |
| **5 — Rich block renderers** | Timeline, diagram (TikZ/Mermaid), music_staff (VexFlow), tree, map, inline quiz. | 1 week | Phase 4 |
| **6 — Voice** | PTT mic, Whisper ASR, ElevenLabs streaming TTS, suggestion chip click → send. | 1 week | Phase 5 |
| **7 — Polish + launch** | Mobile, eval harness on quality, beta invites. | 1 week | Phase 6 |

**v1 estimate: ~5–6 weeks** of focused work, leveraging everything in `@canvasa/tutor-react` and canvas-a backend.

---

## 12. Open questions for the human (to settle before / during Phase 0)

1. **Theme accent.** Indigo (`#5b4fc7`) is my proposal — feels broad/scholarly, distinct from gold/forest. Confirm or pick another.
2. **Anonymous-first?** v0 should let users start without sign-in (autosave to localStorage). Sign-in becomes a Phase-4 enhancement that lets them keep sessions across devices. Confirm.
3. **Home quick-starts.** Suggest these for diversity: "Krebs cycle", "Photosynthesis", "Russian verb aspect", "Octave theory", "Why is Python slow?", "Hindu-Arabic numerals", "Watercolor wet-on-wet", "Black holes". Or curate your own list.
4. **Voice in MVP?** I lean text-first → voice in Phase 6. Strong opinion?
5. **Naming.** "Canvas C" inside this doc / engineering. Public-facing brand on the home page: just **"Tutor"** or something with more identity? (e.g. *"Meraki Tutor"*, *"Sage"*, *"Polymath"*.)

---

## 13. Pointers — where existing artifacts live

| Artifact | Location |
|---|---|
| **React component package** | https://github.com/mukesh-bansal/canvasa-tutor-react (public) |
| **Latest release** | v0.1.3 — https://github.com/mukesh-bansal/canvasa-tutor-react/releases/tag/v0.1.3 |
| **Install** | `npm i github:mukesh-bansal/canvasa-tutor-react#v0.1.3` |
| **CSS variables reference** | `src/styles/tutor.css` in the package |
| **Mode modal** | `src/components/LessonModeModal.tsx` |
| **API client (extend with `/api/conversation/*`)** | `src/services/tutorApi.ts` |
| **Backend (canvas-a)** | EC2 `devbox:/home/ubuntu/canvas-a/scripts/server.py` |
| **Backend port** | 8768 (proxied as `https://canvasa.physolympiad.com`) |
| **Backend systemd** | `canvas-a` service |
| **Existing canvas-a routes to study** | `/api/generate-lesson`, `/api/lesson-status/<sid>` (live-mode polling pattern), `/api/fast-opening` (Haiku narration), `/api/ask-v2` (Q&A loop), `/api/wiki-opensearch` (Wikipedia retrieval) |
| **TTS function** | `elevenlabs_synth(text) -> bytes` and `_elevenlabs_synth(text, out_path)` (with primary→fallback key chain). See `_eleven_keys_in_order()`. |
| **Whisper ASR** | `whisper_transcribe(audio_bytes, filename)` |
| **Audio static mount** | `/canvas-audio/*` — CORS allow-all |
| **ElevenLabs keys** | `ELEVENLABS_API_KEY` (CureFit, primary), `ELEVENLABS_API_KEY_2` (Meraki Labs, fallback). Documented in `/AI Tools/Configs/api_keys.md` on the human's Drive. |
| **Olympiz Google OAuth client_id** | `683115157302-j64iqddqpneapuu93om0g76arp6qg2lk.apps.googleusercontent.com` (reusable for tutor.superstem.ai if redirect URI is added in Google Cloud Console) |
| **Olympiz frontend production snapshot** | https://github.com/mukesh-bansal/olympiz-frontend (private) — tag `olympiad-v2.0.0` |
| **SuperStem integration doc (referencible pattern)** | https://github.com/mukesh-bansal/canvasa-tutor-react/blob/v0.1.3/INTEGRATION_SUPERSTEM.md |

---

## 14. Definition of done — Phase 0 + 1

- [ ] DNS: `tutor.superstem.ai` CNAME or Vercel project pointing to a new build
- [ ] Home page renders at `tutor.superstem.ai` with hero + input + Start + 4 quick-starts
- [ ] Click Start → `/session/<id>` (anonymous, localStorage-backed)
- [ ] 3-pane Canvas C layout renders with placeholder content (no agent yet)
- [ ] Phase-2 block renderers exist for: text, math, code, image, table, list, callout, reference
- [ ] CSS variables wired to tutor.superstem.ai accent palette (Q1 from §12)
- [ ] Component package consumed via `npm i github:mukesh-bansal/canvasa-tutor-react#v0.1.3` (no fork)

When that's true, Phase 2 (real agent loop) becomes a contained backend-only build.

---

## 15. Hand-off note for the building agent

You don't need to start from scratch. Read this doc, then:
1. Skim the `@canvasa/tutor-react` README + `src/styles/tutor.css` to understand the theming model.
2. Skim canvas-a's `server.py` around the routes listed in §13 to understand the existing tool surface.
3. Build Phase 0 + Phase 1 first (mockup-quality, no agent). Confirm the visual rhythm with the human before going further.
4. Phase 2 onward: extend `tutor-react` with new conversation components in a feature branch. Once stable, bump to `@canvasa/tutor-react@0.2.0` (Canvas C is a minor-version bump because it's additive).
5. Backend: add new module `scripts/conversation.py` mounted into `server.py`. Don't touch existing Canvas A routes.
6. Reach out to the human (Mukesh) for: brand-accent confirmation, naming, voice-MVP decision, OAuth redirect URI registration if you want sign-in.

Good luck.
