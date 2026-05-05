# Fermi · `@canvasa/tutor-react` integration

**Audience:** the Fermi agent.
**Outcome:** native AI Tutor inside `fermi.ai` at `/ai-tutor`. No iframe. Fermi-themed via CSS variables.

The full step-by-step is identical to SuperStem's — see `INTEGRATION_SUPERSTEM.md`. **The only differences are below.**

---

## Differences from SuperStem

### Tenant ID

```tsx
configureTutor({
  host: 'https://canvasa.physolympiad.com',
  tenant: 'fermi',          // ← Fermi
});
```

### Theme tokens

Fermi's design language is not yet locked. **For v0.1 the package treats `fermi` as a near-default tenant** — Canvas A serves the standard Canvas A look, and the React landing inherits the package defaults (cream + navy + gold).

Once Fermi's design tokens are locked, replace the placeholder with the real palette:

```css
.fermi-tutor-theme {
  --tutor-bg:           /* TBD */;
  --tutor-surface:      /* TBD */;
  --tutor-text:         /* TBD */;
  --tutor-muted:        /* TBD */;
  --tutor-border:       /* TBD */;
  --tutor-accent:       /* TBD */;
  --tutor-accent-strong:/* TBD */;
  --tutor-primary:      /* TBD */;
  --tutor-on-primary:   /* TBD */;
  --tutor-font-display: /* TBD */;
  --tutor-font-body:    /* TBD */;
}
```

If Fermi's brand is locked at the time you read this, override above with the actual values. If not, leave the wrapper class empty — defaults will apply.

### Vercel rewrite

```json
{
  "redirects": [
    { "source": "/ai-tutor/:slug", "destination": "https://canvasa.physolympiad.com/tutor/:slug?brand=fermi", "permanent": false }
  ]
}
```

The `?brand=fermi` query hits the `fermi` tenant on Canvas A (currently a no-op styling layer + nav-hide).

### Definition of done

Same checklist as SuperStem, with Fermi-specific theme verification:

- [ ] `fermi.ai/ai-tutor` loads and renders without iframe
- [ ] If Fermi tokens are locked: theme matches Fermi's design system
- [ ] If not: package defaults render cleanly (cream + navy + gold)
- [ ] Concept library + Problems tabs populate
- [ ] Lesson card click → runtime works (subdomain hop expected for now)
