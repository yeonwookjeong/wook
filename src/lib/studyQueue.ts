import { getWords, getWordsByDay, getMaxDay } from './words';
import { getDueProgress, getLearnedWordIds } from '../db/progress';
import { Level, Word } from '../types';

export interface StudySession {
  day: number;
  dueWords: Word[];
  newWords: Word[];
}

/** Finds the first day (in order) that still has un-learned words. */
export function getCurrentDay(level: Level): number {
  const learned = getLearnedWordIds();
  const maxDay = getMaxDay(level);
  for (let day = 1; day <= maxDay; day++) {
    const dayWords = getWordsByDay(level, day);
    if (dayWords.some((w) => !learned.has(w.id))) {
      return day;
    }
  }
  return maxDay;
}

export function buildTodaySession(level: Level): StudySession {
  const learned = getLearnedWordIds();
  const now = new Date().toISOString();

  const dueProgress = getDueProgress(now);
  const dueIds = new Set(dueProgress.map((p) => p.wordId));
  const allWords = getWords(level);
  const dueWords = allWords.filter((w) => dueIds.has(w.id));

  const day = getCurrentDay(level);
  const newWords = getWordsByDay(level, day).filter((w) => !learned.has(w.id));

  return { day, dueWords, newWords };
}

export function isDayFullyLearned(level: Level, day: number): boolean {
  const learned = getLearnedWordIds();
  return getWordsByDay(level, day).every((w) => learned.has(w.id));
}
