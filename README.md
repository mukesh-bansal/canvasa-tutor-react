# @canvasa/tutor-react

Embeddable AI Tutor — drop-in React landing + button. Backend stays on Canvas A; this package is just the host-side UI.

Used by **olympiz.ai**, **superstem.ai**, **fermi.ai**.

---

## Install

```bash
npm i github:mukesh-bansal/canvasa-tutor-react#v0.1.0
```

(Replace the git URL when the repo lands on its final remote.)

Peer deps your host must already have:

- `react` ≥ 18
- `react-dom` ≥ 18
- `react-router-dom` ≥ 6
- `@tanstack/react-query` ≥ 5
- `axios` ≥ 1

---

## Use

### 1. Mount the route

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { TutorLanding, configureTutor } from '@canvasa/tutor-react';
import '@canvasa/tutor-react/styles.css';

// One-time config (host + tenant) at app boot:
configureTutor({
  host: 'https://canvasa.physolympiad.com',  // backend
  tenant: 'olympiz',                          // 'olympiz' | 'superstem' | 'fermi'
});

export function App() {
  return (
    <Routes>
      <Route path="/ai-tutor" element={<TutorLanding />} />
    </Routes>
  );
}
```

### 2. Add a CTA in your nav

```tsx
import { TutorButton } from '@canvasa/tutor-react';
<TutorButton to="/ai-tutor" label="AI Tutor" badge="NEW" />
```

### 3. Theme via CSS variables

Override on `:root`, on a wrapper div, or scoped to your tutor route. Defaults are a neutral cream/navy/gold; below is what each host uses.

```css
/* Olympiz / PhysOlympiad — cream + navy + gold */
:root {
  --tutor-bg:           #fbfaf6;
  --tutor-surface:      #ffffff;
  --tutor-text:         #1a1a2e;
  --tutor-muted:        #4a4a5a;
  --tutor-border:       #e7ecf3;
  --tutor-accent:       #c9a227;
  --tutor-accent-strong:#8f7016;
  --tutor-accent-soft:  rgba(201,162,39,0.12);
  --tutor-primary:      #14213d;
  --tutor-primary-hover:#0a162b;
  --tutor-on-primary:   #ffffff;
  --tutor-font-display: 'Playfair Display', Georgia, serif;
  --tutor-font-body:    Inter, -apple-system, sans-serif;
}

/* SuperStem — THEOREM+ ivory + forest */
.tutor-route-wrapper {
  --tutor-bg:           #faf8f3;
  --tutor-surface:      #ffffff;
  --tutor-text:         #1a1826;
  --tutor-muted:        #5c5870;
  --tutor-border:       rgba(30,77,58,0.10);
  --tutor-accent:       #1e4d3a;
  --tutor-accent-strong:#1e4d3a;
  --tutor-accent-soft:  rgba(30,77,58,0.06);
  --tutor-primary:      #1e4d3a;
  --tutor-primary-hover:#143728;
  --tutor-on-primary:   #ffffff;
  --tutor-font-display: 'Cormorant Garamond', Georgia, serif;
  --tutor-font-body:    'Crimson Pro', Georgia, serif;
}

/* Fermi — TBD; see fermi.ai design tokens */
```

### Customising the lesson link target

By default lesson cards link to `/ai-tutor/<slug>`. Override:

```tsx
<TutorLanding lessonHref={(slug) => `/learn/ai-tutor/${slug}`} />
```

Your host should then have a Vercel rewrite/redirect that takes that path to the Canvas A runtime (or proxy through your own infra).

---

## Variables reference

| Variable | Default | Purpose |
|---|---|---|
| `--tutor-bg` | `#fbfaf6` | page background |
| `--tutor-surface` | `#ffffff` | card / section surface |
| `--tutor-surface-soft` | `#f6f4ee` | subtle nested surface |
| `--tutor-text` | `#1a1a2e` | primary text |
| `--tutor-muted` | `#4a4a5a` | secondary text |
| `--tutor-faint` | `#8b8b9b` | tertiary / placeholder |
| `--tutor-border` | `#e7ecf3` | default border |
| `--tutor-accent` | `#c9a227` | primary accent (italic, dots) |
| `--tutor-accent-soft` | `rgba(201,162,39,0.12)` | accent fill |
| `--tutor-accent-strong` | `#8f7016` | darker accent (focus, strong) |
| `--tutor-primary` | `#14213d` | CTA button bg |
| `--tutor-on-primary` | `#ffffff` | CTA text |
| `--tutor-font-display` | `Playfair Display, Georgia, serif` | h1, h2, h3 |
| `--tutor-font-body` | `Inter, …, sans-serif` | body |
| `--tutor-radius`, `--tutor-radius-sm`, `--tutor-radius-lg` | 12 / 8 / 18 px | corner radii |

Full list in `src/styles/tutor.css`.

---

## What's NOT in this package (yet)

- The lesson runtime (`<TutorPlayer />`) — Phase 3. For now, lesson clicks navigate to the Canvas A runtime via Vercel rewrite/redirect. Lessons are not yet rendered as React.
- Auth context — Phase 4. For now `tutorApi` includes `X-Tutor-Tenant` header, but no per-user JWT.
- Full skill / boards / exams tabs — partial in v0.1.

---

## Versioning

Semver. Breaking changes bump major. The repo is private until v1.0.0.

| Version | Release | Notes |
|---|---|---|
| 0.1.0 | 2026-05-05 | Initial extraction from olympiz.ai. `<TutorLanding />`, `<TutorButton />`, CSS-variable theming. |
