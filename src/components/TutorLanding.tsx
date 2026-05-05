import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  tutorEndpoints,
  searchResultBlurb,
  type Topic as LibraryTopic,
  type Problem,
  type WikiSearchResult,
} from '../services/tutorApi';

export type TutorLandingProps = {
  /** Where to send users when they pick a lesson. Default: `/ai-tutor/{slug}`. */
  lessonHref?: (slug: string) => string;
  /** Override the hero copy (defaults shown). */
  heroTitle?: React.ReactNode;
  heroSub?: React.ReactNode;
  /** Optional class to apply to the root, in addition to .tutor-page. */
  className?: string;
};

type LibTab = 'ondemand' | 'concepts' | 'problems' | 'skills';
type SourceKind = 'internal' | 'external' | 'textbook';

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

  async function launchTopic(topic: string) {
    setError(''); setProgress('Starting…'); setBusy(true);
    try {
      const res = await tutorEndpoints.generateLesson(topic);
      const slug = slugFromUrl(res.ready_url);
      if (slug) { navigate(slug); return; }
      poll(res.session_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Generation failed'); setBusy(false);
    }
  }

  async function launchUrl(url: string, title?: string) {
    setError(''); setProgress('Reading source…'); setBusy(true);
    try {
      const res = await tutorEndpoints.generateFromUrl(url, title);
      const slug = slugFromUrl(res.ready_url);
      if (slug) { navigate(slug); return; }
      poll(res.session_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Source failed'); setBusy(false);
    }
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
  const [conceptLevel, setConceptLevel] = useState<'all' | 'HS' | 'UG'>('all');
  const [probQuery, setProbQuery] = useState('');
  const [probChip, setProbChip] = useState<'all' | 'HS' | 'UG' | 'Olympiad' | 'cached'>('all');

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
    launcher.launchTopic(t);
  }

  return (
    <div className={`tutor-page ${className || ''}`.trim()}>
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
        <Tab active={tab === 'skills'} onClick={() => setTab('skills')}>
          AI tutor skills
          {counts ? <span className="tutor-tab__count">{counts.skills_total}</span> : null}
        </Tab>
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
            ]} />
          </div>
          <ConceptList topics={topicsResp?.topics || []} q={conceptQuery} level={conceptLevel} hrefBuilder={lessonHref} />
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
              { value: 'Olympiad', label: 'Olympiad' },
              { value: 'cached',   label: '✓' },
            ]} />
          </div>
          <ProblemList sections={probsResp?.sections || []} q={probQuery} chip={probChip} hrefBuilder={lessonHref} />
        </Section>
      )}

      {tab === 'skills' && (
        <Section title="AI tutor skills" subtitle={counts ? `${counts.skills_total} skills` : ''}>
          <p className="tutor-empty">
            Coming soon — pedagogical skills the tutor can apply (hint laddering, misconception probes, units checks, "explain it back", and more).
          </p>
        </Section>
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
  const [src, setSrc] = useState<SourceKind>('textbook');
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

  const sources: { key: SourceKind; lbl: string; sub: string }[] = [
    { key: 'internal', lbl: 'Internal wiki',    sub: 'SuperStem Physics + AI + HS concept graphs' },
    { key: 'external', lbl: 'External wiki',    sub: 'Wikipedia — live' },
    { key: 'textbook', lbl: 'Textbook chapter', sub: 'SuperStem library — chapters across textbooks' },
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
        Searches across SuperStem Physics Wiki (1400+ articles) · AI Wiki · HS Physics/Math/Chemistry concept graphs · Olympiad textbook chapters.
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
  topics, q, level, hrefBuilder,
}: {
  topics: LibraryTopic[];
  q: string;
  level: 'all' | 'HS' | 'UG';
  hrefBuilder: (slug: string) => string;
}) {
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
      {filtered.map(t => (
        <div key={t.name} style={{ marginBottom: 24 }}>
          <h3>
            <span>{t.icon}</span> {t.name}
            <span className="tutor-tab__count">({t.lessons.length})</span>
          </h3>
          <div className="tutor-card-grid">
            {t.lessons.map(l => (
              <a key={l.slug} href={hrefBuilder(l.slug)} className="tutor-card">
                <div className="tutor-card__title">{l.title}</div>
                <div className="tutor-card__meta">
                  <span>{l.level}</span>
                  {l.cached && <span className="tutor-card__cached">✓ cached</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProblemList({
  sections, q, chip, hrefBuilder,
}: {
  sections: { name: string; icon: string; problems: Problem[] }[];
  q: string;
  chip: 'all' | 'HS' | 'UG' | 'Olympiad' | 'cached';
  hrefBuilder: (slug: string) => string;
}) {
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return sections.map(s => ({
      ...s,
      problems: s.problems.filter(p => {
        if (chip === 'HS' && p.level !== 'HS') return false;
        if (chip === 'UG' && p.level !== 'UG') return false;
        if (chip === 'Olympiad' && p.origin !== 'physolympiad') return false;
        if (chip === 'cached' && !p.cached) return false;
        if (ql && !p.title.toLowerCase().includes(ql) && !(p.statement || '').toLowerCase().includes(ql)) return false;
        return true;
      }),
    })).filter(s => s.problems.length > 0);
  }, [sections, q, chip]);

  if (!sections.length) return <p className="tutor-empty">Loading…</p>;
  if (!filtered.length) return <p className="tutor-empty">No matches.</p>;
  return (
    <div>
      {filtered.map(section => (
        <div key={section.name} style={{ marginBottom: 24 }}>
          <h3>
            <span>{section.icon}</span> {section.name}
            <span className="tutor-tab__count">({section.problems.length})</span>
          </h3>
          {section.problems.slice(0, 50).map(p => (
            <a key={p.slug} href={hrefBuilder(p.slug)} className="tutor-prob">
              <div className="tutor-prob__head">
                <span className="tutor-prob__title">{p.title}</span>
                {p.difficulty && (
                  <span className={`tutor-pill tutor-pill--${p.difficulty}`}>{p.difficulty}</span>
                )}
                {p.level && <span className="tutor-pill">{p.level}</span>}
                {p.source && <span style={{ fontSize: '0.7rem', color: 'var(--tutor-muted)' }}>· {p.source}</span>}
              </div>
              {p.statement && <div className="tutor-prob__statement">{p.statement}</div>}
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TutorLanding;
