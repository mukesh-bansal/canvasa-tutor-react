# SuperStem · `@canvasa/tutor-react` integration

**Audience:** the SuperStem agent.
**Outcome:** native AI Tutor inside `superstem.ai` at `/ai-tutor` (full landing) **+ "Ask AI" buttons everywhere** (wiki articles, problem pages, etc.) that open the Guide-me / I-do-it picker. No iframe, anywhere. THEOREM+ ivory + forest theme.

---

## Step 1 — Install the package (v0.1.2)

```bash
npm i github:mukesh-bansal/canvasa-tutor-react#v0.1.2
```

Peer deps your host must already have: `react` ≥ 18, `react-dom` ≥ 18, `react-router-dom` ≥ 6, `@tanstack/react-query` ≥ 5, `axios` ≥ 1.

---

## Step 2 — Configure backend host + tenant at app boot

In `src/main.tsx` (or wherever the app boots, **before any tutor component mounts**):

```tsx
import { configureTutor } from '@canvasa/tutor-react';

configureTutor({
  host: 'https://canvasa.physolympiad.com',  // Canvas A backend
  tenant: 'superstem',
});
```

`X-Tutor-Tenant: superstem` header is sent on every API call so Canvas A can filter content / branding / limits per tenant.

---

## Step 3 — Mount the full landing at `/ai-tutor`

```tsx
import { TutorLanding } from '@canvasa/tutor-react';
import '@canvasa/tutor-react/styles.css';

<Route path="/ai-tutor" element={<SuperStemTutorRoute />} />
```

```tsx
// src/pages/SuperStemTutorRoute.tsx
import { TutorLanding } from '@canvasa/tutor-react';

export default function SuperStemTutorRoute() {
  return (
    <div className="superstem-tutor-theme">
      <TutorLanding />
    </div>
  );
}
```

The wrapper `superstem-tutor-theme` div is where the THEOREM+ CSS-variable overrides apply — see Step 5.

---

## Step 4 — Add "Ask AI" buttons on wiki / problem / any page (NEW in v0.1.2)

This is what your earlier integration was missing. Anywhere SuperStem has a context-aware "Ask AI" surface — a wiki article, a problem detail page, a concept card — drop in `<AskTutorButton>`:

```tsx
import { AskTutorButton } from '@canvasa/tutor-react';

// Inside a wiki article component:
<AskTutorButton
  lesson={{
    slug: article.slug,            // e.g. 'bohr-model'
    title: article.title,          // shown in the modal
    cached: article.tutor_cached,  // optional — if you already know
    guide_cached: article.guide_cached,
  }}
  label="Ask AI ↗"
  badge="NEW"
/>
```

Click → modal opens with "You teach, I learn." (default) and "You guide, I do it." → user picks → tutor launches.

**Behavior under the hood:**
- Walkthrough + cached → navigates to `/ai-tutor/<slug>` on the **host** (your Vercel rewrite hands off to canvasa runtime — see Step 6)
- Walkthrough + uncached → POST `/api/generate-lesson` with the title, polls status, navigates when ready
- Make-me (cached or not) → navigates to `https://canvasa.physolympiad.com/guide?lesson=<slug>` (canvasa handles cached + uncached internally)

### Variations

**Skip the picker — go straight to make-me on certain pages:**
```tsx
<AskTutorButton lesson={...} autoStart="make_me" />
```

**Custom trigger styling (e.g. an icon-only button matching SuperStem's design):**
```tsx
<AskTutorButton
  lesson={...}
  trigger={(onClick) => (
    <button className="my-custom-chip" onClick={onClick}>
      <SparkIcon /> Ask AI
    </button>
  )}
/>
```

**Default-select make-me (but still show the picker):**
```tsx
<AskTutorButton lesson={...} defaultMode="make_me" />
```

**Programmatic launch (if you need to open the picker from a custom event handler):**
```tsx
import { LessonModeModal } from '@canvasa/tutor-react';
const [pick, setPick] = useState(null);
<>
  <button onClick={() => setPick({ slug, title, cached, guide_cached })}>Custom CTA</button>
  {pick && <LessonModeModal lesson={pick} onClose={() => setPick(null)} />}
</>
```

---

## Step 5 — Theme tokens (THEOREM+ ivory + forest)

```css
.superstem-tutor-theme {
  --tutor-bg:           #faf8f3;
  --tutor-surface:      #ffffff;
  --tutor-surface-soft: #f4f1ea;
  --tutor-text:         #1a1826;
  --tutor-muted:        #5c5870;
  --tutor-faint:        #9896aa;
  --tutor-border:       rgba(30, 77, 58, 0.10);
  --tutor-border-soft:  rgba(30, 77, 58, 0.05);

  --tutor-accent:       #1e4d3a;
  --tutor-accent-strong:#143728;
  --tutor-accent-soft:  rgba(30, 77, 58, 0.06);
  --tutor-on-accent:    #ffffff;

  --tutor-primary:      #1e4d3a;
  --tutor-primary-hover:#143728;
  --tutor-on-primary:   #ffffff;

  --tutor-radius:       14px;
  --tutor-radius-sm:    10px;
  --tutor-radius-lg:    20px;

  --tutor-font-display: 'Cormorant Garamond', Georgia, serif;
  --tutor-font-body:    'Crimson Pro', Georgia, serif;
  --tutor-font-mono:    'JetBrains Mono', ui-monospace, monospace;
}
```

**The modal inherits these vars too** — the picker on a wiki page renders in THEOREM+ as long as the `.superstem-tutor-theme` ancestor is on the page (typically wrap your whole app or your `/ai-tutor` route + any page that has `<AskTutorButton>`). Easiest: apply to the `<body>` or the top-level layout.

---

## Step 6 — Vercel rewrite for lesson runtime URLs

```json
// vercel.json
{
  "redirects": [
    { "source": "/ai-tutor/:slug", "destination": "https://canvasa.physolympiad.com/tutor/:slug?brand=superstem", "permanent": false }
  ]
}
```

The `?brand=superstem` query triggers Canvas A's THEOREM+ themed lesson runtime when SuperStem users land on it.

---

## Step 7 — Replace the AI Tutor nav button

Old (iframe overlay) — search for `canvas-a:open-overlay` or `canvasa.physolympiad.com` and **delete those code paths**. Replace the nav entry with either:

```tsx
import { TutorButton } from '@canvasa/tutor-react';
<TutorButton to="/ai-tutor" label="AI Tutor" badge="NEW" />
```

or a regular `<Link to="/ai-tutor">AI Tutor</Link>` styled to match SuperStem nav.

---

## Step 8 — Smoke test

1. `https://superstem.ai/ai-tutor` — full landing in THEOREM+ theme. No iframe. URL stays.
2. **Concept-library / problems tabs** — clicking a card opens the picker (NOT direct nav).
3. **Picker → walkthrough cached** → instant lesson runtime.
4. **Picker → walkthrough uncached** → progress text ("first beat ready" etc.) → redirects when ready.
5. **Picker → make-me** → navigates to canvasa `/guide?lesson=<slug>` (URL hop is expected, see Phase 0.5 below).
6. **Wiki page with `<AskTutorButton>`** — click opens picker, same flow.
7. **`autoStart="make_me"` page** — click skips the picker and goes straight to make-me.
8. ESC closes picker, click outside closes picker.
9. Mobile + desktop both work.

---

## What NOT to do

- ❌ Don't render `<TutorLanding />` or `<AskTutorButton>` inside an iframe.
- ❌ Don't hand-roll the picker — use `<LessonModeModal>` or `<AskTutorButton>` for upgrade safety.
- ❌ Don't override `.tutor-modal__option-title` etc. directly — use the CSS variables.
- ❌ Don't hit `canvasa.physolympiad.com` directly with `fetch` — use the package's `tutorEndpoints.*` so the tenant header is set.

## Definition of done

- [ ] `superstem.ai/ai-tutor` loads natively in THEOREM+
- [ ] Concept + Problem cards open the picker (no direct nav)
- [ ] Walkthrough cached / uncached / make-me all work end-to-end
- [ ] At least one wiki page has a working `<AskTutorButton>`
- [ ] At least one wiki page uses `autoStart="make_me"` if SuperStem wants direct guide-me there
- [ ] Old iframe code (`canvas-a:open-overlay`, etc.) is fully deleted
- [ ] Mobile + desktop both look right

Ping back when done. Phase 1 of the SuperStem migration is complete.
