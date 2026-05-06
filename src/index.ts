// Public API surface for @canvasa/tutor-react

import './styles/tutor.css';

export { TutorLanding } from './components/TutorLanding';
export type { TutorLandingProps } from './components/TutorLanding';

export { TutorButton } from './components/TutorButton';
export type { TutorButtonProps } from './components/TutorButton';

export { LessonModeModal } from './components/LessonModeModal';
export type { LessonModeModalProps, LessonMode, ModalLesson } from './components/LessonModeModal';

export { AskTutorButton } from './components/AskTutorButton';
export type { AskTutorButtonProps } from './components/AskTutorButton';

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
