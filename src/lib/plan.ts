import { allSentences, moduleById, modules, sentenceById } from '../data/curriculum';
import { AppData, DayLog, PlanDay, Rating, SentenceProgress } from '../types';
import { addDays, dateKey } from './dates';

export const planSize = (minutes: 5 | 10 | 15): number =>
  minutes === 5 ? 3 : minutes === 10 ? 5 : 7;

export const MASTERED_AT = 65;

const lowMasteryFirst = (a: SentenceProgress, b: SentenceProgress) =>
  a.mastery - b.mastery || a.lastPracticedAt.localeCompare(b.lastPracticedAt);

/**
 * Today's plan: a couple of spaced reviews, then new sentences in curriculum
 * order starting from the learner's recommended module. Deterministic per day
 * because the result is cached in the persisted plan.
 */
export const buildPlan = (data: AppData, today: string = dateKey()): PlanDay => {
  const size = planSize(data.profile.dailyMinutes);
  const progress = data.progress;
  const startIndex = Math.max(0, data.profile.startModule - 1);

  const reviewed = Object.entries(progress)
    .filter(([, p]) => p.attempts > 0)
    .sort(([, a], [, b]) => lowMasteryFirst(a, b));

  const dueReviews = reviewed.filter(([, p]) => p.due <= today || p.mastery < 60);
  const reviewQuota = Math.min(2, Math.floor(size * 0.4));
  const picked: string[] = [];

  for (const [id] of dueReviews) {
    if (picked.length >= reviewQuota) break;
    picked.push(id);
  }

  const ordered = [...modules.slice(startIndex), ...modules.slice(0, startIndex)];
  for (const mod of ordered) {
    for (const sentence of mod.sentences) {
      if (picked.length >= size) break;
      if (!progress[sentence.id] && !picked.includes(sentence.id)) picked.push(sentence.id);
    }
    if (picked.length >= size) break;
  }

  // Everything has been touched at least once: keep recycling the weakest.
  if (picked.length < size) {
    for (const [id] of reviewed) {
      if (picked.length >= size) break;
      if (!picked.includes(id)) picked.push(id);
    }
  }
  // Brand-new learner safety net.
  if (picked.length < size) {
    for (const sentence of allSentences) {
      if (picked.length >= size) break;
      if (!picked.includes(sentence.id)) picked.push(sentence.id);
    }
  }

  return { date: today, sentenceIds: picked.slice(0, size), generated: true };
};

export const ensurePlan = (data: AppData, today: string = dateKey()): PlanDay => {
  if (data.plan && data.plan.date === today && data.plan.sentenceIds.length > 0) {
    return data.plan;
  }
  return buildPlan(data, today);
};

export const emptyDay = (date: string): DayLog => ({ date, completed: [], minutes: 0 });

export const withCompletion = (
  days: Record<string, DayLog>,
  sentenceId: string,
  today: string
): Record<string, DayLog> => {
  const day = days[today] ?? emptyDay(today);
  const completed = day.completed.includes(sentenceId)
    ? day.completed
    : [...day.completed, sentenceId];
  return {
    ...days,
    [today]: {
      ...day,
      completed,
      minutes: Math.max(day.minutes, Math.round(completed.length * 1.6)),
    },
  };
};

export const nextProgress = (
  previous: SentenceProgress | undefined,
  rating: Rating,
  today: string
): SentenceProgress => {
  const base = previous?.mastery ?? 0;
  let mastery: number;
  let gap: number;

  if (rating === 0) {
    mastery = Math.round(base * 0.5);
    gap = 1;
  } else if (rating === 1) {
    mastery = base === 0 ? 42 : Math.min(100, base + 13);
    gap = 2;
  } else {
    mastery = base === 0 ? 68 : Math.min(100, base + 23);
    gap = mastery >= 85 ? 6 : 4;
  }

  return {
    attempts: (previous?.attempts ?? 0) + 1,
    mastery,
    lastRating: rating,
    lastPracticedAt: today,
    due: addDays(today, gap),
  };
};

export const streakOf = (days: Record<string, DayLog>, today: string = dateKey()): number => {
  let cursor = today;
  if (!days[cursor]?.completed.length) {
    cursor = addDays(today, -1);
    if (!days[cursor]?.completed.length) return 0;
  }
  let streak = 0;
  while (days[cursor]?.completed.length) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const totalPracticed = (days: Record<string, DayLog>): number =>
  Object.values(days).reduce((sum, day) => sum + day.completed.length, 0);

export const masteredCount = (progress: Record<string, SentenceProgress>): number =>
  Object.values(progress).filter((p) => p.mastery >= MASTERED_AT).length;

export const overallMastery = (progress: Record<string, SentenceProgress>): number => {
  const values = Object.values(progress);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, p) => sum + p.mastery, 0) / values.length);
};

export interface ModuleStat {
  id: string;
  title: string;
  en: string;
  index: number;
  mastery: number;
  practiced: number;
  total: number;
}

export const moduleStats = (progress: Record<string, SentenceProgress>): ModuleStat[] =>
  modules.map((mod) => {
    const values = mod.sentences
      .map((s) => progress[s.id])
      .filter((p): p is SentenceProgress => Boolean(p));
    const mastery = values.length
      ? Math.round(values.reduce((sum, p) => sum + p.mastery, 0) / mod.sentences.length)
      : 0;
    return {
      id: mod.id,
      title: mod.title,
      en: mod.en,
      index: mod.index,
      mastery,
      practiced: values.length,
      total: mod.sentences.length,
    };
  });

export const weakestModule = (progress: Record<string, SentenceProgress>): ModuleStat => {
  const stats = moduleStats(progress);
  return [...stats].sort((a, b) => a.mastery - b.mastery || a.index - b.index)[0];
};

export const focusOf = (id: string): string => sentenceById[id]?.focus ?? '';

export const moduleTitleOf = (id: string): string => {
  const sentence = sentenceById[id];
  return sentence ? moduleById[sentence.moduleId].title : '';
};
