import type { ReactElement, ReactNode, CSSProperties } from 'react';

export type TutorButtonProps = {
  /** Where the button navigates. Default `/ai-tutor`. */
  to?: string;
  /** Visible label. Default "AI Tutor". */
  label?: string;
  /** Optional badge (e.g. "NEW"). */
  badge?: string;
  className?: string;
  /**
   * Optional custom Link component for SPA-style navigation. If not provided,
   * renders a plain `<a href>` — works in any framework (React Router,
   * Next.js, vanilla SPA) but does a full-page navigation.
   *
   * Vite + react-router-dom hosts can pass:
   *   import { Link } from 'react-router-dom';
   *   <TutorButton linkComponent={Link} />
   *
   * Next.js (App Router) hosts can pass:
   *   import Link from 'next/link';
   *   <TutorButton linkComponent={({ to, ...p }) => <Link href={to} {...p} />} />
   *
   * Added in v0.1.11 so the SDK no longer hard-requires react-router-dom
   * as a peer dep — Fermi (Next.js) unblocked.
   */
  linkComponent?: (props: {
    to: string;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
  }) => ReactElement;
};

/**
 * Small CTA component a host can drop anywhere to link to the Tutor route.
 * Inherits theme via ambient CSS variables.
 *
 * Default rendering uses a plain `<a href>` for maximum framework-agnostic
 * compatibility. Pass `linkComponent` to keep SPA client-side routing intact.
 */
export function TutorButton({
  to = '/ai-tutor',
  label = 'AI Tutor',
  badge,
  className,
  linkComponent,
}: TutorButtonProps) {
  const cls = `tutor-btn ${className || ''}`.trim();
  const style: CSSProperties = { gap: 6 };
  const inner: ReactNode = (
    <>
      <span>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.1em',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--tutor-accent)',
            color: 'var(--tutor-on-accent)',
          }}
        >
          {badge}
        </span>
      )}
    </>
  );

  if (linkComponent) {
    const LinkComp = linkComponent;
    return (
      <LinkComp to={to} className={cls} style={style}>
        {inner}
      </LinkComp>
    );
  }

  // Plain anchor — full-page navigation. Works without a router.
  return (
    <a href={to} className={cls} style={style}>
      {inner}
    </a>
  );
}

export default TutorButton;
