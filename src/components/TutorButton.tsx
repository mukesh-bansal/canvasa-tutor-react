import { Link } from 'react-router-dom';

export type TutorButtonProps = {
  /** Where the button navigates. Default `/ai-tutor`. */
  to?: string;
  /** Visible label. Default "AI Tutor". */
  label?: string;
  /** Optional badge (e.g. "NEW"). */
  badge?: string;
  className?: string;
};

/**
 * Small CTA component a host can drop anywhere to link to the Tutor route.
 * Inherits theme via ambient CSS variables.
 */
export function TutorButton({ to = '/ai-tutor', label = 'AI Tutor', badge, className }: TutorButtonProps) {
  return (
    <Link to={to} className={`tutor-btn ${className || ''}`.trim()} style={{ gap: 6 }}>
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
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export default TutorButton;
