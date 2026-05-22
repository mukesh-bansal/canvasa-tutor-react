/**
 * resolveReturnUrl — figures out where Canvas A's Back / Home button should
 * send the user after they're done with the tutor.
 *
 * Resolution order (first match wins):
 *
 *   1. The integrating host passed `?return=<encoded-url>` in the URL of the
 *      page that mounts this SDK. Useful when the host wants to deep-link
 *      the user back to a specific surface that isn't where they came from.
 *
 *   2. Auto-detect: `<window.location.origin><window.location.pathname>` —
 *      i.e. send the user back to the exact page they were on when they
 *      invoked the tutor. Works for `/ai-tutor`, `/study`, `/courses/...`,
 *      and any other host route uniformly.
 *
 *   3. Final fallback: `<origin>/study` — the canonical study surface
 *      in SuperStem / Olympiz / Fermi (used only when window is unavailable,
 *      e.g. SSR).
 *
 * v0.1.8: added the `?return=` short-circuit.
 * v0.1.9: changed the auto-detect fallback from hardcoded `/study` to
 *   `window.location.pathname`. Hosts that mount the SDK on /ai-tutor
 *   (SuperStem stage/dev) now return to /ai-tutor by default instead of
 *   landing on /study, fixing a UX inconsistency.
 */
export function resolveReturnUrl(): string {
  try {
    const passed = new URLSearchParams(window.location.search).get('return');
    if (passed && /^https?:\/\//i.test(passed)) {
      return passed;
    }
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${window.location.pathname}`;
    }
  } catch {
    // SSR or sandboxed iframe without window — fall through to default.
  }
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/study`;
}
