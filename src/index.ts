// Public API surface for @canvasa/tutor-react

import './styles/tutor.css';

export { TutorLanding } from './components/TutorLanding';
export type { TutorLandingProps } from './components/TutorLanding';

export { TutorButton } from './components/TutorButton';
export type { TutorButtonProps } from './components/TutorButton';

export {
  configureTutor,
  getTutorHost,
  getTutorTenant,
  tutorApi,
  tutorEndpoints,
  searchResultBlurb,
} from './services/tutorApi';
export type {
  Lesson,
  Topic,
  Problem,
  ProblemSection,
  InventoryCounts,
  LibraryTopicsResponse,
  ProblemsLibraryResponse,
  GenerateLessonResponse,
  LessonStatus,
  WikiSearchResult,
} from './services/tutorApi';

// Hosts must also import the stylesheet:
//   import '@canvasa/tutor-react/styles.css';
