import { useState } from 'react';
import { LessonModeModal, type ModalLesson, type LessonMode } from './LessonModeModal';

export type AskTutorButtonProps = {
  /** Lesson context the button represents (slug, title, cache flags). */
  lesson: ModalLesson;
  /** Default-selected mode in the modal. */
  defaultMode?: LessonMode;
  /** Skip the picker entirely — start in this mode immediately. Useful for surfaces (e.g. specific wiki types) where you always want make_me. */
  autoStart?: LessonMode;
  /** Where to navigate when a cached walkthrough is picked. Default: `/ai-tutor/<slug>`. */
  lessonHref?: (slug: string) => string;
  /** Visible label. Default "Ask AI ↗". */
  label?: string;
  /** Optional badge next to the label. */
  badge?: string;
  /** Fully replace the trigger styling: pass any inline button content + className. */
  className?: string;
  /** Render-prop override: if provided, replaces the default <button>. Receives onClick. */
  trigger?: (onClick: () => void) => React.ReactNode;
};

/**
 * Drop-in CTA. Opens the Guide-me / Make-me picker on click and, on confirm,
 * launches the tutor (cached → instant; uncached → generate + navigate).
 *
 * Example (wiki article footer):
 *   <AskTutorButton lesson={{ slug, title, cached, guide_cached }} />
 *
 * Example (always go straight to make-me):
 *   <AskTutorButton lesson={...} autoStart="make_me" />
 *
 * Example (custom trigger):
 *   <AskTutorButton lesson={...} trigger={(onClick) => <MyFancyChip onClick={onClick} />} />
 */
export function AskTutorButton({
  lesson,
  defaultMode = 'walkthrough',
  autoStart,
  lessonHref,
  label = 'Ask AI ↗',
  badge,
  className,
  trigger,
}: AskTutorButtonProps) {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(true);

  return (
    <>
      {trigger ? trigger(handleClick) : (
        <button
          type="button"
          onClick={handleClick}
          className={className || 'tutor-btn'}
          style={{ gap: 6 }}
        >
          <span>{label}</span>
          {badge && (
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.1em',
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--tutor-accent)',
              color: 'var(--tutor-on-accent)',
            }}>{badge}</span>
          )}
        </button>
      )}
      {open && (
        <LessonModeModal
          lesson={lesson}
          defaultMode={defaultMode}
          autoStart={autoStart}
          lessonHref={lessonHref}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default AskTutorButton;
