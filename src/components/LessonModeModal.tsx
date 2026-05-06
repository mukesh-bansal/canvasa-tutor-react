import { useEffect, useState } from 'react';
import { getTutorHost } from '../services/tutorApi';

export type LessonMode = 'walkthrough' | 'make_me';

export type ModalLesson = {
  /** Cached lesson slug (must match the backend's lesson file). Optional for free-form topic launches. */
  slug?: string;
  /** Display title shown in the modal header. Used as the topic when generating a fresh lesson. */
  title: string;
  /** True if the walkthrough lesson is pre-generated. */
  cached?: boolean;
  /** True if Mode 2 (make_me) skeleton is pre-generated. */
  guide_cached?: boolean;
};

export type LessonModeModalProps = {
  lesson: ModalLesson;
  /** Where to navigate when a cached walkthrough is picked. Default: `/ai-tutor/<slug>`. */
  lessonHref?: (slug: string) => string;
  /** Pre-select a mode. Default `walkthrough`. */
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
  defaultMode = 'walkthrough',
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

  function start(m: LessonMode) {
    // Make-me — always go to canvasa /guide?lesson=<slug>; backend handles cached + uncached.
    if (m === 'make_me') {
      if (!lesson.slug) {
        // No slug — can't address /guide directly. Fall through to walkthrough live mode.
        window.location.href = `${getTutorHost()}/tutor?ask=${encodeURIComponent(lesson.title)}`;
        return;
      }
      window.location.href = `${getTutorHost()}/guide?lesson=${encodeURIComponent(lesson.slug)}`;
      return;
    }

    // Walkthrough + cached — clean host URL, host's redirect/proxy points to canvasa runtime.
    if (lesson.slug && lesson.cached) {
      window.location.href = lessonHref(lesson.slug);
      return;
    }

    // Walkthrough + uncached — navigate IMMEDIATELY to canvas-a's live-mode entry.
    // /tutor?ask=<title> plays the hello narration on page load, then bridging
    // audio while server-side generation runs, then transitions to beat 1 with
    // beat audio. Doing this client-side (POST /generate-lesson + poll + nav)
    // makes the user wait silently and skips the intro audio entirely.
    window.location.href = `${getTutorHost()}/tutor?ask=${encodeURIComponent(lesson.title)}`;
  }

  // Auto-start path: skip rendering the picker, just kick off
  useEffect(() => {
    if (autoStart) { start(autoStart); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              checked={mode === 'walkthrough'}
              onSelect={() => setMode('walkthrough')}
              title='"You teach, I learn."'
              desc="Tutor narrates every step. Watch the board, listen along, ask tangents anytime. Default mode."
            />
            <ModeOption
              checked={mode === 'make_me'}
              onSelect={() => setMode('make_me')}
              title='"You guide, I do it."'
              badge="NEW"
              desc="Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward. Interactive learning."
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
  checked, onSelect, title, desc, badge,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
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
          {badge && <span className="tutor-modal__option-badge">{badge}</span>}
          <div className="tutor-modal__option-desc">{desc}</div>
        </div>
      </div>
    </button>
  );
}

export default LessonModeModal;
