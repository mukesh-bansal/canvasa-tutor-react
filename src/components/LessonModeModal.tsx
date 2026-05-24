import { useEffect, useState } from 'react';
import { getTutorHost } from '../services/tutorApi';
import { resolveReturnUrl } from '../services/returnUrl';

/**
 * Tutor learning modes — v0.1.10 rename + new "Together" mode.
 *
 * v0.1.10 renames the two existing modes for clarity and adds a third:
 *   • `lecture`   — tutor narrates every step beat-by-beat (was `walkthrough`)
 *   • `guide`     — tutor poses each step as a question (was `make_me`)
 *   • `together`  — tutor + student trade turns through the problem (NEW)
 *
 * The legacy slugs `walkthrough` and `make_me` remain accepted in the type
 * union and are normalized to the new names inside `start()`. Hosts pinned
 * to v0.1.9 or earlier keep working without code changes for at least one
 * minor version; we'll drop the aliases in v0.2.
 *
 * `together` is currently a PLACEHOLDER that routes to the same /guide URL
 * as `guide` — Mukesh will wire the real backend experience in a later
 * release. The modal option is live now so consuming hosts can light up
 * the third radio + future-proof their feature flags.
 */
export type LessonMode =
  | 'lecture'
  | 'guide'
  | 'together'
  /** @deprecated use 'lecture' — removed in v0.2 */
  | 'walkthrough'
  /** @deprecated use 'guide' — removed in v0.2 */
  | 'make_me';

/** Normalize legacy slugs to the v0.1.10 names. */
function canonicalMode(m: LessonMode): 'lecture' | 'guide' | 'together' {
  if (m === 'walkthrough') return 'lecture';
  if (m === 'make_me') return 'guide';
  return m;
}

export type ModalLesson = {
  /** Cached lesson slug (must match the backend's lesson file). Optional for free-form topic launches. */
  slug?: string;
  /** Display title shown in the modal header. Used as the topic when generating a fresh lesson. */
  title: string;
  /** True if the lecture (formerly walkthrough) lesson is pre-generated. */
  cached?: boolean;
  /** True if the guide-mode (formerly make_me) skeleton is pre-generated. */
  guide_cached?: boolean;
};

export type LessonModeModalProps = {
  lesson: ModalLesson;
  /** Where to navigate when a cached lecture is picked. Default: `/ai-tutor/<slug>`. */
  lessonHref?: (slug: string) => string;
  /** Pre-select a mode. Default `lecture`. */
  defaultMode?: LessonMode;
  /** If set, skip the modal entirely and start in this mode immediately. */
  autoStart?: LessonMode;
  /** Override the modal eyebrow / title / subtitle. */
  eyebrow?: string;
  onClose: () => void;
};

const DEFAULT_HREF = (slug: string) => `/ai-tutor/${encodeURIComponent(slug)}`;

export function LessonModeModal({
  lesson,
  lessonHref = DEFAULT_HREF,
  defaultMode = 'lecture',
  autoStart,
  eyebrow = 'Pick a learning mode',
  onClose,
}: LessonModeModalProps) {
  const [mode, setMode] = useState<LessonMode>(autoStart || defaultMode);

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function start(input: LessonMode) {
    const m = canonicalMode(input);
    const RETURN_URL = resolveReturnUrl();
    const ret = `&return=${encodeURIComponent(RETURN_URL)}`;

    // `guide` and `together` both route to canvasa /guide?lesson=<slug> for now.
    // When Mukesh wires the real Together experience, it gets its own route
    // (likely /together?lesson=<slug>) and this branch splits. Hosts won't
    // need to change anything when that happens — the SDK absorbs the switch.
    if (m === 'guide' || m === 'together') {
      if (!lesson.slug) {
        // No slug — can't address /guide directly. Fall through to live-build via /tutor.
        window.location.href = `${getTutorHost()}/tutor?ask=${encodeURIComponent(lesson.title)}${ret}`;
        return;
      }
      window.location.href = `${getTutorHost()}/guide?lesson=${encodeURIComponent(lesson.slug)}${ret}`;
      return;
    }

    // Lecture + cached — clean host URL, host's redirect/proxy points to canvasa runtime.
    if (lesson.slug && lesson.cached) {
      window.location.href = lessonHref(lesson.slug);
      return;
    }

    // Lecture + uncached — navigate IMMEDIATELY to canvas-a's live-mode entry.
    // /tutor?ask=<title> plays the hello narration on page load, then bridging
    // audio while server-side generation runs, then transitions to beat 1 with
    // beat audio. Doing this client-side (POST /generate-lesson + poll + nav)
    // makes the user wait silently and skips the intro audio entirely.
    window.location.href = `${getTutorHost()}/tutor?ask=${encodeURIComponent(lesson.title)}${ret}`;
  }

  // Auto-start path: skip rendering the picker, just kick off
  useEffect(() => {
    if (autoStart) { start(autoStart); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canonical = canonicalMode(mode);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="tutor-modal-backdrop"
    >
      <div className="tutor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutor-modal__eyebrow">{eyebrow}</div>
        <h2 className="tutor-modal__title">{lesson.title}</h2>
        <p className="tutor-modal__sub">
          {lesson.slug && lesson.cached
            ? 'Cached — instant start.'
            : 'Click Start. The intro audio plays right away while we generate the first beat.'}
        </p>

        {!autoStart && (
          <>
            <ModeOption
              checked={canonical === 'lecture'}
              onSelect={() => setMode('lecture')}
              title='Lecture'
              tagline='"You teach, I learn."'
              desc="Tutor narrates every step beat-by-beat. Watch the board, listen along, ask tangents anytime. Default mode."
            />
            <ModeOption
              checked={canonical === 'guide'}
              onSelect={() => setMode('guide')}
              title='Guide'
              tagline='"You guide, I do it."'
              desc="Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward."
            />
            <ModeOption
              checked={canonical === 'together'}
              onSelect={() => setMode('together')}
              title='Together'
              tagline='"Let&rsquo;s solve together."'
              badge="NEW"
              desc="You and the tutor solve the problem together, trading turns step-by-step until the solution emerges."
            />
          </>
        )}

        <div className="tutor-modal__actions">
          <button
            type="button"
            onClick={onClose}
            className="tutor-btn--ghost"
          >
            Cancel
          </button>
          {!autoStart && (
            <button
              type="button"
              onClick={() => start(mode)}
              className="tutor-btn"
            >
              Start →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeOption({
  checked, onSelect, title, tagline, desc, badge,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  tagline?: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={checked ? 'tutor-modal__option is-active' : 'tutor-modal__option'}
    >
      <div className="tutor-modal__option-row">
        <span className="tutor-modal__radio">
          {checked && <span className="tutor-modal__radio-dot" />}
        </span>
        <div style={{ flex: 1 }}>
          <span className="tutor-modal__option-title">{title}</span>
          {tagline && <span className="tutor-modal__option-tagline"> &middot; <em dangerouslySetInnerHTML={{ __html: tagline }} /></span>}
          {badge && <span className="tutor-modal__option-badge">{badge}</span>}
          <div className="tutor-modal__option-desc">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default LessonModeModal;
