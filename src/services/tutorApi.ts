import axios from 'axios';

/**
 * tutorApi — single shared client targeting the Canvas A backend.
 * Host overrides the backend host either via VITE_TUTOR_HOST env or by
 * passing a `host` config when initialising.
 */

let _host: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_TUTOR_HOST) ||
  'https://canvasa.physolympiad.com';

let _tenant: string = 'olympiz';

export function configureTutor(opts: { host?: string; tenant?: string }) {
  if (opts.host) _host = opts.host.replace(/\/$/, '');
  if (opts.tenant) _tenant = opts.tenant;
  // Rebuild axios instance so subsequent calls pick up the host
  tutorApi.defaults.baseURL = `${_host}/api`;
  tutorApi.defaults.headers.common['X-Tutor-Tenant'] = _tenant;
}

export function getTutorHost(): string { return _host; }
export function getTutorTenant(): string { return _tenant; }

export const tutorApi = axios.create({
  baseURL: `${_host}/api`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'X-Tutor-Tenant': _tenant,
  },
});

/* ── Types ───────────────────────────────────────────────── */
export type Lesson = {
  slug: string;
  title: string;
  url: string;
  level: string;
  cached: boolean;
  mode2_cached?: boolean;
  guide_cached?: boolean;
};

export type Topic = {
  name: string;
  icon: string;
  lessons: Lesson[];
};

export type Problem = {
  slug: string;
  po_id?: number;
  origin?: string;
  section?: string;
  section_icon?: string;
  difficulty?: string;
  level?: string;
  source?: string;
  source_kind?: string;
  title: string;
  statement?: string;
  cached?: boolean;
};

export type ProblemSection = {
  name: string;
  icon: string;
  problems: Problem[];
};

export type InventoryCounts = {
  ok: boolean;
  concepts_cached: number;
  concepts_total: number;
  concepts_imported: number;
  problems_total: number;
  problems_cached: number;
  mode2_cached: number;
  skills_total: number;
  superstem_textbooks: number;
  superstem_chapters: number;
  physolympiad_problems: number;
};

export type LibraryTopicsResponse = { ok: boolean; lesson_count: number; topics: Topic[]; };
export type ProblemsLibraryResponse = { ok: boolean; total: number; cached_count: number; sections: ProblemSection[]; };

export type GenerateLessonResponse = {
  session_id: string;
  hello?: { id: string; text: string; audio_url?: string } | null;
  status_url: string;
  poll_interval_ms: number;
  cached?: boolean;
  ready_url?: string;
};

export type LessonStatus = {
  status: string;
  ready_url?: string;
  error?: string;
  progress?: string;
  topic?: string;
};

export type WikiSearchResult = {
  title: string;
  description?: string;
  desc?: string;
  snippet?: string;
  url?: string;
  thumbnail?: string;
  kind?: string;
  subject?: string;
};

export function searchResultBlurb(r: WikiSearchResult): string {
  return r.description || r.desc || r.snippet || '';
}

/* ── Endpoints ───────────────────────────────────────────── */
export const tutorEndpoints = {
  inventoryCounts: () => tutorApi.get<InventoryCounts>('/inventory-counts').then(r => r.data),
  libraryTopics: () => tutorApi.get<LibraryTopicsResponse>('/library-topics').then(r => r.data),
  problemsLibrary: () => tutorApi.get<ProblemsLibraryResponse>('/problems-library').then(r => r.data),

  generateLesson: (topic: string) =>
    tutorApi.post<GenerateLessonResponse>('/generate-lesson', { topic }).then(r => r.data),
  generateFromUrl: (url: string, title?: string) =>
    tutorApi.post<GenerateLessonResponse>('/generate-from-url', { url, title }).then(r => r.data),
  generateFromPdf: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return tutorApi.post<GenerateLessonResponse>('/generate-from-pdf', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  lessonStatus: (sessionId: string) =>
    tutorApi.get<LessonStatus>(`/lesson-status/${sessionId}`).then(r => r.data),
  wikiSearch: (q: string) =>
    tutorApi.get<{ results: WikiSearchResult[] }>('/wiki-opensearch', { params: { q } }).then(r => r.data),
  superstemSearch: (q: string) =>
    tutorApi.get<{ results: WikiSearchResult[] }>('/superstem-search', { params: { q } }).then(r => r.data),
};

export default tutorApi;
