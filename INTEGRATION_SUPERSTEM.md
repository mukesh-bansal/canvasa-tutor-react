# SuperStem · `@canvasa/tutor-react` integration

**Audience:** the SuperStem agent.
**Outcome:** native AI Tutor inside `superstem.ai` at `/ai-tutor`. No iframe. THEOREM+ ivory + forest theme. Same components olympiz.ai uses.

---

## Step 1 — Install the package

In the SuperStem React frontend:

```bash
npm i github:mukesh-bansal/canvasa-tutor-react#v0.1.0
```

(If the canvasa GitHub remote isn't set up yet, install from the local path the package was extracted to, or pin to a commit hash. Confirm with the human first.)

This will pull `axios`, `@tanstack/react-query`, `react-router-dom` only if peer deps are missing.

---

## Step 2 — Configure backend host + tenant at app boot

Pick the file where the app boots (typically `src/main.tsx` or `src/App.tsx`, before any `<TutorLanding />` mounts):

```tsx
import { configureTutor } from '@canvasa/tutor-react';

configureTutor({
  host: 'https://canvasa.physolympiad.com',  // Canvas A backend (will move to canvasa.olympiz.ai later)
  tenant: 'superstem',
});
```

This sets the `X-Tutor-Tenant: superstem` header on every API call, so Canvas A can filter content / branding / limits per tenant.

---

## Step 3 — Mount the route

Add to your existing routes:

```tsx
import { TutorLanding } from '@canvasa/tutor-react';
import '@canvasa/tutor-react/styles.css';

// in your <Routes>:
<Route path="/ai-tutor" element={<SuperStemTutorRoute />} />
```

Wrap `<TutorLanding />` so the THEOREM+ tokens apply only on the tutor route (not globally):

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

---

## Step 4 — Theme tokens (THEOREM+ ivory + forest)

Add to your global CSS (or a scoped CSS module):

```css
.superstem-tutor-theme {
  --tutor-bg:           #faf8f3;     /* ivory page bg */
  --tutor-surface:      #ffffff;     /* card surface */
  --tutor-surface-soft: #f4f1ea;     /* nested fill */
  --tutor-text:         #1a1826;     /* ink */
  --tutor-muted:        #5c5870;     /* secondary */
  --tutor-faint:        #9896aa;     /* placeholder */
  --tutor-border:       rgba(30, 77, 58, 0.10);
  --tutor-border-soft:  rgba(30, 77, 58, 0.05);

  --tutor-accent:       #1e4d3a;     /* forest */
  --tutor-accent-strong:#143728;     /* darker forest */
  --tutor-accent-soft:  rgba(30, 77, 58, 0.06);
  --tutor-on-accent:    #ffffff;

  --tutor-primary:      #1e4d3a;     /* CTA bg = forest */
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

If THEOREM+ uses different fonts in production, swap them. Make sure the fonts are already loaded by your global font setup (Cormorant + Crimson Pro are part of THEOREM+ stack already).

---

## Step 5 — Add the AI Tutor nav button

In the SuperStem navbar, replace the current AI Tutor entry (which probably opens canvasa as an iframe) with a `<TutorButton>` or a regular `<Link to="/ai-tutor">`:

```tsx
import { TutorButton } from '@canvasa/tutor-react';
<TutorButton to="/ai-tutor" label="AI Tutor" badge="NEW" />
```

Or — if you need full control over the styling — just use react-router-dom directly:

```tsx
<Link to="/ai-tutor" className="...your-nav-classes...">AI Tutor</Link>
```

**Remove the iframe overlay.** Search the SuperStem repo for `canvasa.physolympiad.com` or `canvas-a:open-overlay` and delete those code paths.

---

## Step 6 — (Optional) Customise lesson links

If SuperStem wants lesson clicks to go through a SuperStem URL pattern (e.g. `/learn/ai-tutor/<slug>`), pass `lessonHref`:

```tsx
<TutorLanding lessonHref={(slug) => `/learn/ai-tutor/${slug}`} />
```

Otherwise the default `/ai-tutor/<slug>` is used. You'll then need a Vercel rewrite/redirect from that path to the Canvas A runtime — same approach olympiz.ai uses:

```json
// vercel.json
{
  "redirects": [
    { "source": "/ai-tutor/:slug", "destination": "https://canvasa.physolympiad.com/tutor/:slug?brand=superstem", "permanent": false }
  ]
}
```

Note the `?brand=superstem` query — that triggers the Canvas A backend to serve the THEOREM+ themed lesson runtime when SuperStem users land on it.

---

## Step 7 — Smoke test

After deploy:

1. Go to `https://superstem.ai/ai-tutor` — should render in THEOREM+ ivory + forest, hero "What do you want to **learn** today?", 4 tabs.
2. The page should NOT be in an iframe; URL bar stays on `superstem.ai`.
3. Switch to **Concept library** tab → 1879+ topics load from canvasa backend (cross-origin fetch, CORS already permissive).
4. Switch to **Problems** tab → 1005+ problems load.
5. Type a topic ("Bernoulli's principle") and hit AI Tutor → status updates ("Reading source…", "Generating…"), then redirects to lesson runtime.
6. Click any lesson card → goes to `/ai-tutor/<slug>` → redirects to canvasa runtime page (URL hop is expected at lesson start, until Phase 0.5).

---

## What NOT to do

- ❌ Don't render `<TutorLanding />` inside an `<iframe>`. The whole point is native React.
- ❌ Don't override individual class names (`.tutor-section`, `.tutor-btn`) directly in your CSS — use the CSS variables. That keeps you upgrade-safe.
- ❌ Don't fork the package source; if you need behavior changes, file an issue / PR upstream.
- ❌ Don't hit `canvasa.physolympiad.com` directly with `fetch` — go through the package's API client (`tutorEndpoints.*`) so the tenant header is set.

## Definition of done

- [ ] `superstem.ai/ai-tutor` loads and renders in THEOREM+ theme
- [ ] No iframe in the path; URL stays on superstem.ai
- [ ] Old iframe overlay code (`canvas-a:open-overlay`, etc.) deleted
- [ ] Concept library + Problems tabs populate from canvasa
- [ ] Lesson card click → lesson runtime works (URL hops to canvasa, that's OK for now)
- [ ] Mobile + desktop both look right

Ping back when done. Phase 1 of the migration is complete.
