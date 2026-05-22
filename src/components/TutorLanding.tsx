import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  tutorEndpoints,
  searchResultBlurb,
  getTutorHost,
  type Topic as LibraryTopic,
  type Problem,
  type WikiSearchResult,
} from '../services/tutorApi';
import { LessonModeModal, type ModalLesson } from './LessonModeModal';
import { resolveReturnUrl } from '../services/returnUrl';

// v0.1.7 (Olympiz v2.05 · 2026-05-19): umbrella version pill, visible top-right.
// v2.04: KaTeX picks up window.renderMathInElement from a host <script> tag
// (more reliable than the dynamic import), polls for ~3s on first mount,
// keys include array index so duplicate backend slugs don't crash React.
export const OLYMPIZ_VERSION = '2.05';

// v0.1.4: KaTeX auto-render for problem statements ($M$ etc.). Loaded lazily so
// the package doesn't force a peer dep — host must have `katex` installed.
type RenderMathInElement = (el: HTMLElement, opts: any) => void;
let _renderMath: RenderMathInElement | null = null;

/**
 * v0.1.6: KaTeX resolution — TWO routes, in priority order:
 *   (a) `window.renderMathInElement` (host loaded katex auto-render via
 *       <script> tag in index.html — proven canvas-a pattern, robust to
 *       Vite optimizeDeps quirks).
 *   (b) Dynamic `import('katex/contrib/auto-render')` — fallback for hosts
 *       that have `katex` as an npm dep but no script tag. Requires the
 *       host's bundler to resolve the subpath; sometimes flaky.
 *
 * If neither resolves, the statements render as raw text and we console.warn.
 * Hosts that want guaranteed math rendering should add to their index.html:
 *
 *   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css" crossorigin>
 *   <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js" crossorigin></script>
 *   <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/contrib/auto-render.min.js" crossorigin></script>
 */
async function ensureKatex(): Promise<RenderMathInElement | null> {
  if (_renderMath) return _renderMath;
  // (a) Global from <script> tag
  // @ts-ignore — host script tag attaches to window
  if (typeof window !== 'undefined' && typeof (window as any).renderMathInElement === 'function') {
    // @ts-ignore
    _renderMath = (window as any).renderMathInElement as RenderMathInElement;
    return _renderMath;
  }
  // (b) ESM dynamic import — last resort
  try {
    // @ts-ignore — katex auto-render module ships without types
    const mod = await import('katex/contrib/auto-render');
    // @ts-ignore — KaTeX CSS side-effect import for the math glyphs
    await import('katex/dist/katex.min.css');
    _renderMath = (mod.default || mod) as RenderMathInElement;
    return _renderMath;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[tutor-react] katex auto-render unavailable (no global, no ESM); raw LaTeX will show. Add the CDN <script> tags from the JSDoc comment to enable.', e);
    return null;
  }
}
function useKatexRender(ref: React.RefObject<HTMLElement>, deps: unknown[]) {
  useEffect(() => {
    let cancelled = false;
    // Re-poll up to ~3 s for window.renderMathInElement if the host's
    // CDN <script defer> hasn't landed when the component first mounts.
    let attempt = 0;
    function tryRender() {
      if (cancelled) return;
      ensureKatex().then(render => {
        if (cancelled) return;
        if (!render || !ref.current) {
          if (attempt++ < 15) setTimeout(tryRender, 200);
          return;
        }
        render(ref.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$',  right: '$',  display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
          // v0.1.6: NB — 'button' is intentionally NOT in ignoredTags. The
          // ProblemList renders each problem as a <button> for click handling,
          // and the statement div lives INSIDE that button. With 'button'
          // excluded, KaTeX walks into buttons and renders the math.
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        });
      });
    }
    tryRender();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export type TutorLandingProps = {
  /** Where to send users when they pick a lesson. Default: `/ai-tutor/{slug}`. */
  lessonHref?: (slug: string) => string;
  /** Override the hero copy (defaults shown). */
  heroTitle?: React.ReactNode;
  heroSub?: React.ReactNode;
  /** Optional class to apply to the root, in addition to .tutor-page. */
  className?: string;
};

// v0.1.4: dropped 'skills' tab. ConceptLevel + ProbChip add 'G' (graduate).
// 'textbook' source removed upstream (was a host patch — see 2026-05-09 backlog).
type LibTab = 'ondemand' | 'concepts' | 'problems';
type SourceKind = 'internal' | 'external';
type ConceptLevel = 'all' | 'HS' | 'UG' | 'G';
type ProbChip = 'all' | 'HS' | 'UG' | 'G' | 'Olympiad' | 'cached';

const DEFAULT_HREF = (slug: string) => `/ai-tutor/${slug}`;

/* ──────────────────────────────────────────────────────────────
 * Lesson generation hook
 * ────────────────────────────────────────────────────────────── */
/** Robust slug extractor — Canvas A returns ready_url in multiple shapes:
 *   /lesson_<slug>.html   (legacy)
 *   /tutor/<slug>
 *   /tutor?lesson=<slug>
 */
function slugFromUrl(maybeUrl?: string): string {
  if (!maybeUrl) return '';
  try {
    const u = new URL(maybeUrl, 'http://x');
    const fromQuery = u.searchParams.get('lesson');
    if (fromQuery) return fromQuery;
    let p = u.pathname;
    p = p.replace(/^\/+/, '');
    p = p.replace(/^tutor\//, '');
    p = p.replace(/^lesson_/, '');
    p = p.replace(/\.html$/, '');
    return p;
  } catch { return ''; }
}

function useLessonLauncher(hrefBuilder: (slug: string) => string) {
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function navigate(slug: string) {
    if (!slug) { setError('Lesson ready but slug missing'); setBusy(false); return; }
    window.location.href = hrefBuilder(slug);
  }

  async function poll(sessionId: string) {
    let lastStatus = '';
    while (true) {
      try {
        const s = await tutorEndpoints.lessonStatus(sessionId);
        const stepLabel = (s.progress || s.status || '').replace(/_/g, ' ');
        if (stepLabel && stepLabel !== lastStatus) { setProgress(stepLabel); lastStatus = stepLabel; }
        // Canvas A signals readiness via ready_url being non-null (not status==='ready').
        if (s.ready_url) { setBusy(false); navigate(slugFromUrl(s.ready_url)); return; }
        if (s.status === 'error' || s.error) {
          setError(s.error || 'Generation failed'); setBusy(false); return;
        }
      } catch (e: any) {
        setError(e?.message || 'Status check failed'); setBusy(false); return;
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // v0.1.8: return-URL resolution moved into a shared helper that first
  // checks for a `?return=` already on the host page's URL (so e.g. SuperStem
  // can deep-link the user to /ai-tutor with `?return=...` and the SDK picks
  // it up without manual threading), then falls back to `<origin>/study`.
  const RETURN_URL = resolveReturnUrl();

  function launchTopic(topic: string) {
    setError(''); setProgress('Opening tutor…'); setBusy(true);
    window.location.replace(
      `${getTutorHost()}/tutor?ask=${encodeURIComponent(topic)}&return=${encodeURIComponent(RETURN_URL)}`,
    );
  }

  function launchUrl(url: string, title?: string) {
    setError(''); setProgress('Opening tutor…'); setBusy(true);
    const ask = (title && title.trim()) || url;
    window.location.replace(
      `${getTutorHost()}/tutor?ask=${encodeURIComponent(ask)}&return=${encodeURIComponent(RETURN_URL)}`,
    );
  }

  async function launchPdf(file: File) {
    setError(''); setProgress('Reading PDF…'); setBusy(true);
    try {
      const res = await tutorEndpoints.generateFromPdf(file);
      const slug = slugFromUrl(res.ready_url);
      if (slug) { navigate(slug); return; }
      poll(res.session_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'PDF upload failed'); setBusy(false);
    }
  }

  return { progress, busy, error, launchTopic, launchUrl, launchPdf };
}

/* ──────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────── */
export function TutorLanding({
  lessonHref = DEFAULT_HREF,
  heroTitle,
  heroSub,
  className,
}: TutorLandingProps) {
  const [tab, setTab] = useState<LibTab>('ondemand');
  const [topic, setTopic] = useState('');
  const [conceptQuery, setConceptQuery] = useState('');
  const [conceptLevel, setConceptLevel] = useState<ConceptLevel>('all');
  const [probQuery, setProbQuery] = useState('');
  const [probChip, setProbChip] = useState<ProbChip>('all');
  const [modalLesson, setModalLesson] = useState<ModalLesson | null>(null);

  const launcher = useLessonLauncher(lessonHref);

  const { data: counts } = useQuery({
    queryKey: ['tutor-inventory-counts'],
    queryFn: tutorEndpoints.inventoryCounts,
    staleTime: 5 * 60_000,
  });
  const { data: topicsResp } = useQuery({
    queryKey: ['tutor-library-topics'],
    queryFn: tutorEndpoints.libraryTopics,
    enabled: tab === 'concepts',
    staleTime: 5 * 60_000,
  });
  const { data: probsResp } = useQuery({
    queryKey: ['tutor-problems-library'],
    queryFn: tutorEndpoints.problemsLibrary,
    enabled: tab === 'problems',
    staleTime: 5 * 60_000,
  });

  function handleTopicGo() {
    const t = topic.trim();
    if (!t) return;
    // v0.1.9: route the topic-launch through LessonModeModal so the user sees
    // the same mode-picker interstitial as the concept-library / problem-library
    // entry points. LessonModeModal.start() handles the no-slug case correctly —
    // falls through to `/tutor?ask=${title}&return=...` when lesson.slug is
    // absent (LessonModeModal.tsx:65–71). Previously this called
    // launcher.launchTopic(t) directly, which skipped the modal entirely.
    setModalLesson({ title: t });
  }

  return (
    <div className={`tutor-page ${className || ''}`.trim()}>
      {/* v0.1.4: Olympiz umbrella version pill — fixed top-right, visible regardless of tab.
          Bump OLYMPIZ_VERSION on every shipped UX change so cache state is observable. */}
      <div
        title="Olympiz version. Hard-refresh if this doesn't match the latest deploy."
        style={{
          position: 'fixed', top: 10, right: 14, zIndex: 99999,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 10.5, letterSpacing: '0.06em',
          padding: '3px 9px', borderRadius: 999,
          background: 'rgba(255,255,255,0.94)', color: '#46718a',
          border: '1px solid rgba(70,113,138,0.18)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          pointerEvents: 'auto', userSelect: 'none',
        }}>
        v{OLYMPIZ_VERSION}
      </div>

      <section className="tutor-hero">
        <h1>{heroTitle ?? <>What do you want to <em>learn</em> today?</>}</h1>
        <p>{heroSub ?? 'Drop a question.'}</p>
      </section>

      <nav className="tutor-tabs" role="tablist">
        <Tab active={tab === 'ondemand'} onClick={() => setTab('ondemand')}>
          On-demand <span className="tutor-tab__count">5 ways</span>
        </Tab>
        <Tab active={tab === 'concepts'} onClick={() => setTab('concepts')}>
          Concept library
          {counts ? <span className="tutor-tab__count">{counts.concepts_total.toLocaleString()}</span> : null}
        </Tab>
        <Tab active={tab === 'problems'} onClick={() => setTab('problems')}>
          Problems
          {counts ? <span className="tutor-tab__count">{counts.problems_total.toLocaleString()}</span> : null}
        </Tab>
        {/* v0.1.4: "AI tutor skills" tab removed per Olympiz UX. */}
      </nav>

      {tab === 'ondemand' && (
        <>
          <Section title="Type a topic.">
            <div className="tutor-row">
              <input
                type="text"
                className="tutor-input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTopicGo()}
                disabled={launcher.busy}
                placeholder="e.g. Bernoulli's principle · Lenz's law · Maxwell's equations"
              />
              <button
                type="button"
                className="tutor-btn"
                onClick={handleTopicGo}
                disabled={launcher.busy || !topic.trim()}
              >
                {launcher.busy ? 'Working…' : 'AI Tutor →'}
              </button>
            </div>
            {(launcher.progress || launcher.error) && (
              <div className={launcher.error ? 'tutor-status tutor-status--error' : 'tutor-status'}>
                {launcher.error || launcher.progress}
              </div>
            )}
          </Section>

          <SourcePicker disabled={launcher.busy} onPick={launcher.launchUrl} />

          <Section title="Or, drop a chapter or paper.">
            <PdfDrop disabled={launcher.busy} onFile={launcher.launchPdf} />
          </Section>
        </>
      )}

      {tab === 'concepts' && (
        <Section
          title="Concept library"
          subtitle={topicsResp ? `${topicsResp.lesson_count.toLocaleString()} lessons across ${topicsResp.topics.length} topics` : 'Loading…'}
        >
          <div className="tutor-row" style={{ marginBottom: 14 }}>
            <input
              type="text"
              className="tutor-input tutor-input--sm"
              value={conceptQuery}
              onChange={e => setConceptQuery(e.target.value)}
              placeholder="Search concepts…"
            />
            <ChipGroup value={conceptLevel} onChange={setConceptLevel} options={[
              { value: 'all', label: 'All' },
              { value: 'HS',  label: 'HS' },
              { value: 'UG',  label: 'UG' },
              { value: 'G',   label: 'G' },
            ]} />
          </div>
          <ConceptList topics={topicsResp?.topics || []} q={conceptQuery} level={conceptLevel} onPick={setModalLesson} />
        </Section>
      )}

      {tab === 'problems' && (
        <Section
          title="Problems"
          subtitle={probsResp ? `${probsResp.total.toLocaleString()} problems · ${probsResp.cached_count.toLocaleString()} cached` : 'Loading…'}
        >
          <div className="tutor-row" style={{ marginBottom: 14 }}>
            <input
              type="text"
              className="tutor-input tutor-input--sm"
              value={probQuery}
              onChange={e => setProbQuery(e.target.value)}
              placeholder="Search problems…"
            />
            <ChipGroup value={probChip} onChange={setProbChip} options={[
              { value: 'all',      label: 'All' },
              { value: 'HS',       label: 'HS' },
              { value: 'UG',       label: 'UG' },
              { value: 'G',        label: 'G' },
              { value: 'Olympiad', label: 'Olympiad' },
              { value: 'cached',   label: '✓' },
            ]} />
          </div>
          <ProblemList sections={probsResp?.sections || []} q={probQuery} chip={probChip} onPick={setModalLesson} />
        </Section>
      )}

      {/* v0.1.4: "AI tutor skills" pane removed alongside its tab. */}

      {modalLesson && (
        <LessonModeModal
          lesson={modalLesson}
          lessonHref={lessonHref}
          onClose={() => setModalLesson(null)}
        />
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={active ? 'tutor-tab is-active' : 'tutor-tab'}>
      {children}
    </button>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="tutor-section">
      <h2>{title}</h2>
      {subtitle && <div className="tutor-section__sub">{subtitle}</div>}
      {children}
    </section>
  );
}

function ChipGroup<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.value} type="button"
          className={value === o.value ? 'tutor-chip is-active' : 'tutor-chip'}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SourcePicker({ disabled, onPick }: { disabled: boolean; onPick: (url: string, title?: string) => void }) {
  const [src, setSrc] = useState<SourceKind>('internal');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = src === 'external'
          ? await tutorEndpoints.wikiSearch(q.trim())
          : await tutorEndpoints.superstemSearch(q.trim());
        setResults(res.results || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, [q, src]);

  // v0.1.4 (was: host patch — now upstream): "Textbook chapter" removed. The
  // SourcePicker had it wired to the same superstem-search endpoint as Internal
  // wiki, which returns Physics-Wiki entries and never actual textbook chapters
  // (poisoned UUID-titled rows leaked through). Re-add only when a real
  // textbook-chapter search endpoint exists with proper chapter titles.
  const sources: { key: SourceKind; lbl: string; sub: string }[] = [
    { key: 'internal', lbl: 'Internal wiki', sub: 'SuperStem Physics + AI + HS concept graphs' },
    { key: 'external', lbl: 'External wiki', sub: 'Wikipedia — live' },
  ];

  return (
    <Section title="Or, point at a source.">
      <div className="tutor-sources">
        {sources.map(s => (
          <button key={s.key} type="button"
            className={src === s.key ? 'tutor-source is-active' : 'tutor-source'}
            onClick={() => setSrc(s.key)}>
            <div className="tutor-source__row">
              <span className="tutor-source__dot" />
              <div>
                <div className="tutor-source__lbl">{s.lbl}</div>
                <div className="tutor-source__sub">{s.sub}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <input type="text" className="tutor-input tutor-input--sm"
        value={q} onChange={e => setQ(e.target.value)} disabled={disabled}
        placeholder="Type to search the selected source…" />
      {searching && <div className="tutor-status">Searching…</div>}
      {results.length > 0 && (
        <div className="tutor-results">
          {results.slice(0, 10).map((r, i) => (
            <button key={i} type="button"
              className="tutor-result"
              disabled={disabled || !r.url}
              onClick={() => r.url && onPick(r.url, r.title)}>
              <div className="tutor-result__title">{r.title}</div>
              {searchResultBlurb(r) && <div className="tutor-result__blurb">{searchResultBlurb(r)}</div>}
            </button>
          ))}
        </div>
      )}
      <div className="tutor-hint">
        Searches across SuperStem Physics Wiki (1400+ articles) · AI Wiki · HS Physics/Math/Chemistry concept graphs.
      </div>
    </Section>
  );
}

function PdfDrop({ disabled, onFile }: { disabled: boolean; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  function handle(f: File | null) {
    if (!f || disabled) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) return;
    onFile(f);
  }
  return (
    <div
      className={`tutor-drop${hover ? ' is-hover' : ''}`}
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={e => { e.preventDefault(); setHover(false); handle(e.dataTransfer.files?.[0] || null); }}
    >
      <div className="tutor-drop__icon">📄</div>
      <div className="tutor-drop__hint">Drop a PDF here, or <strong>click to choose a file</strong></div>
      <input ref={ref} type="file" accept="application/pdf" hidden
        onChange={e => handle(e.target.files?.[0] || null)} />
    </div>
  );
}

function ConceptList({
  topics, q, level, onPick,
}: {
  topics: LibraryTopic[];
  q: string;
  level: ConceptLevel;
  onPick: (l: ModalLesson) => void;
}) {
  // v0.1.4: collapsible-per-section state. Default all expanded; user toggles per section.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return topics.map(t => ({
      ...t,
      lessons: t.lessons.filter(l => {
        if (level !== 'all' && l.level !== level) return false;
        if (ql && !l.title.toLowerCase().includes(ql)) return false;
        return true;
      }),
    })).filter(t => t.lessons.length > 0);
  }, [topics, q, level]);

  if (!topics.length) return <p className="tutor-empty">Loading…</p>;
  if (!filtered.length) return <p className="tutor-empty">No matches.</p>;
  return (
    <div>
      {filtered.map(t => {
        const isCollapsed = !!collapsed[t.name];
        return (
          <div key={t.name} style={{ marginBottom: 24 }}>
            <h3
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed(c => ({ ...c, [t.name]: !c[t.name] }))}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCollapsed(c => ({ ...c, [t.name]: !c[t.name] }));
                }
              }}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block', width: '0.7em',
                  transition: 'transform 0.15s ease',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  color: 'var(--tutor-muted, #5a7c92)',
                  fontSize: '0.75em',
                }}
              >▾</span>
              <span>{t.icon}</span> {t.name}
              <span className="tutor-tab__count">({t.lessons.length})</span>
            </h3>
            {!isCollapsed && (
              <div className="tutor-card-grid">
                {t.lessons.map((l, idx) => (
                  <button
                    // v0.1.6: key includes idx — same reason as ProblemList: backend
                    // can return the same slug twice within a topic (data bug, but
                    // we tolerate it on the React side rather than crash).
                    key={t.name + '::' + l.slug + '::' + idx}
                    type="button"
                    onClick={() => onPick({ slug: l.slug, title: l.title, cached: l.cached, guide_cached: l.guide_cached })}
                    className="tutor-card"
                    style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
                  >
                    <div className="tutor-card__title">{l.title}</div>
                    <div className="tutor-card__meta">
                      <span>{l.level}</span>
                      {l.cached && <span className="tutor-card__cached">✓ cached</span>}
                      {l.guide_cached && <span style={{ color: 'var(--tutor-warning)' }}>⚡ guide</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProblemList({
  sections, q, chip, onPick,
}: {
  sections: { name: string; icon: string; problems: Problem[] }[];
  q: string;
  chip: ProbChip;
  onPick: (l: ModalLesson) => void;
}) {
  // v0.1.4: collapsible-per-section state.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // v0.1.4: ref + KaTeX hook so problem statements with $...$ render as math.
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return sections.map(s => ({
      ...s,
      problems: s.problems.filter(p => {
        if (chip === 'HS' && p.level !== 'HS') return false;
        if (chip === 'UG' && p.level !== 'UG') return false;
        // v0.1.4: 'G' = graduate-level. Backend may tag p.level === 'G' or 'Grad'; accept either.
        if (chip === 'G'  && p.level !== 'G' && (p.level as string) !== 'Grad') return false;
        if (chip === 'Olympiad' && p.origin !== 'physolympiad') return false;
        if (chip === 'cached' && !p.cached) return false;
        if (ql && !p.title.toLowerCase().includes(ql) && !(p.statement || '').toLowerCase().includes(ql)) return false;
        return true;
      }),
    })).filter(s => s.problems.length > 0);
  }, [sections, q, chip]);

  // Re-render KaTeX whenever the filtered list or collapse state changes.
  useKatexRender(containerRef as React.RefObject<HTMLElement>, [filtered, collapsed]);

  if (!sections.length) return <p className="tutor-empty">Loading…</p>;
  if (!filtered.length) return <p className="tutor-empty">No matches.</p>;
  return (
    <div ref={containerRef}>
      {filtered.map(section => {
        const isCollapsed = !!collapsed[section.name];
        return (
          <div key={section.name} style={{ marginBottom: 24 }}>
            <h3
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed(c => ({ ...c, [section.name]: !c[section.name] }))}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCollapsed(c => ({ ...c, [section.name]: !c[section.name] }));
                }
              }}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block', width: '0.7em',
                  transition: 'transform 0.15s ease',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  color: 'var(--tutor-muted, #5a7c92)',
                  fontSize: '0.75em',
                }}
              >▾</span>
              <span>{section.icon}</span> {section.name}
              <span className="tutor-tab__count">({section.problems.length})</span>
            </h3>
            {!isCollapsed && section.problems.map((p, idx) => (
              // v0.1.4: removed .slice(0, 50) cap — show all problems per section.
              <button
                // v0.1.6: key includes idx — backend occasionally returns the same
                // slug twice within one section (e.g. variational-method-for-particle-
                // in-linear-potential under "Forces & Newton's Laws"). Index makes
                // the key uniquely identify the row even with duplicate slugs.
                key={section.name + '::' + p.slug + '::' + idx}
                type="button"
                onClick={() => onPick({ slug: p.slug, title: p.title, cached: p.cached, guide_cached: (p as any).guide_cached })}
                className="tutor-prob"
                style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', display: 'block', width: '100%' }}
              >
                <div className="tutor-prob__head">
                  <span className="tutor-prob__title">{p.title}</span>
                  {p.difficulty && (
                    <span className={`tutor-pill tutor-pill--${p.difficulty}`}>{p.difficulty}</span>
                  )}
                  {p.level && <span className="tutor-pill">{p.level}</span>}
                  {p.source && <span style={{ fontSize: '0.7rem', color: 'var(--tutor-muted)' }}>· {p.source}</span>}
                </div>
                {p.statement && <div className="tutor-prob__statement">{p.statement}</div>}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default TutorLanding;
