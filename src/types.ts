export type Level = 1 | 2 | 3;

export type Rating = 0 | 1 | 2;

export interface Sentence {
  id: string;
  moduleId: string;
  /** Curly braces mark chunks that link together, e.g. "Not {at all}." */
  text: string;
  /** Broad American IPA, no slashes. */
  ipa: string;
  /** Short Chinese label, e.g. "辅音 + 元音". */
  focus: string;
  /** One-sentence explanation of what happens in the mouth. */
  tip: string;
  /** A tiny drill that isolates the tricky moment. */
  drill: string;
  level: Level;
}

export interface Module {
  id: string;
  index: number;
  title: string;
  en: string;
  summary: string;
  icon: string;
  level: Level;
  sentences: Sentence[];
}

export interface PassageLine {
  /** A / B are the two speakers, N is narration. */
  speaker: 'A' | 'B' | 'N';
  text: string;
}

export interface Passage {
  id: string;
  title: string;
  en: string;
  summary: string;
  level: Level;
  focus: string;
  tip: string;
  lines: PassageLine[];
}

/** Remote audio catalog, fetched from GitHub raw and cached locally. */
export interface AudioCatalog {
  version: number;
  baseUrl: string;
  files: Record<string, string>;
}

export interface SentenceProgress {
  attempts: number;
  /** 0-100 */
  mastery: number;
  lastRating: Rating | null;
  lastPracticedAt: string;
  /** ISO date (YYYY-MM-DD) of the next ideal review. */
  due: string;
}

export interface DayLog {
  date: string;
  completed: string[];
  minutes: number;
}

export interface PlanDay {
  date: string;
  sentenceIds: string[];
  /** True when the plan was created by the scheduler for this date. */
  generated: boolean;
}

export interface Profile {
  onboarded: boolean;
  /** 1 = 起步, 2 = 进阶, 3 = 自如 */
  level: Level;
  /** Module index to start from (1-based). */
  startModule: number;
  dailyMinutes: 5 | 10 | 15;
  goal: string;
  createdAt: string;
}

export interface Settings {
  /** Speech rate multiplier, 0.6 - 1.1 */
  rate: number;
  autoPlay: boolean;
  haptics: boolean;
}

export interface AppData {
  version: 1;
  profile: Profile;
  progress: Record<string, SentenceProgress>;
  days: Record<string, DayLog>;
  plan: PlanDay | null;
  settings: Settings;
}
