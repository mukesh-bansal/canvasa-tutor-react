import { useEffect, useState } from 'react';
import { tutorEndpoints, getTutorHost } from '../services/tutorApi';

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

function slugFromUrl(maybeUrl?: string): string {
  if (!maybeUrl) return '';
  try {
    const u = new URL(maybeUrl, 'http://x');
    const fromQuery = u.searchParams.get('lesson');
    if (fromQuery) return fromQuery;
    let p = u.pathname;
    p = p.replace(/^\/+/, '').replace(/^tutor\//, '').replace(/^lesson_/, '').replace(/\.html$/, '');
    return p;
  } catch { return ''; }
}

export function LessonModeModal({
  lesson,
  lessonHref = DEFAULT_HREF,
  defaultMode = 'walkthrough',
  autoStart,
  eyebrow = 'Pick a learning mode',
  onClose,
}: LessonModeModalProps) {
  const [mode, setMode] = useState<LessonMode>(autoStart || defaultMode);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function start(m: LessonMode) {
    setError('');

    // Make-me — always go to canvasa /guide?lesson=<slug>; backend handles cached + uncached.
    if (m === 'make_me') {
      if (!lesson.slug) {
        // No slug — can't address /guide directly. Fall through to walkthrough generation.
        await startWalkthroughGenerated();
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

    // Walkthrough + uncached — kick off generation.
    await startWalkthroughGenerated();
  }

  async function startWalkthroughGenerated() {
    setBusy(true);
    setProgress('Starting…');
    try {
      const res = await tutorEndpoints.generateLesson(lesson.title);
      if (res.ready_url) {
        const slug = slugFromUrl(res.ready_url);
        if (slug) { window.location.href = lessonHref(slug); return; }
      }
      let last = '';
      while (true) {
        const s = await tutorEndpoints.lessonStatus(res.session_id);
        const step = (s.progress || s.status || '').replace(/_/g, ' ');
        if (step && step !== last) { setProgress(step); last = step; }
        if (s.ready_url) {
          const slug = slugFromUrl(s.ready_url);
          if (slug) { window.location.href = lessonHref(slug); return; }
        }
        if (s.status === 'error' || s.error) {
          setError(s.error || 'Generation failed'); setBusy(false); return;
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Generation failed');
      setBusy(false);
    }
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
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
      className="tutor-modal-backdrop"
    >
      <div className="tutor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutor-modal__eyebrow">{eyebrow}</div>
        <h2 className="tutor-modal__title">{lesson.title}</h2>
        <p className="tutor-modal__sub">
          {lesson.slug && lesson.cached
            ? 'Cached — instant start.'
            : "Not cached yet — we'll generate the first beat for you (~30–60s)."}
        </p>

        {!autoStart && (
          <>
            <ModeOption
              checked={mode === 'walkthrough'}
              onSelect={() => !busy && setMode('walkthrough')}
              title='"You teach, I learn."'
              desc="Tutor narrates every step. Watch the board, listen along, ask tangents anytime. Default mode."
            />
            <ModeOption
              checked={mode === 'make_me'}
              onSelect={() => !busy && setMode('make_me')}
              title='"You guide, I do it."'
              badge="NEW"
              desc="Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward. Interactive learning."
            />
          </>
        )}

        {(progress || error) && (
          <div style={{
            marginTop: 14,
            fontSize: 13,
            color: error ? 'var(--tutor-danger)' : 'var(--tutor-muted)',
          }}>
            {error || progress}
          </div>
        )}

        <div className="tutor-modal__actions">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="tutor-btn--ghost"
          >
            Cancel
          </button>
          {!autoStart && (
            <button
              type="button"
              onClick={() => start(mode)}
              disabled={busy}
              className="tutor-btn"
            >
              {busy ? 'Working…' : 'Start →'}
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
