import db from './client';
import { StreakInfo } from '../types';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / msPerDay
  );
}

export function getStreak(): StreakInfo {
  const row = db.getFirstSync<{ last_study_date: string | null; current_streak: number }>(
    `SELECT last_study_date, current_streak FROM streak WHERE id = 1;`
  );
  return {
    lastStudyDate: row?.last_study_date ?? null,
    currentStreak: row?.current_streak ?? 0,
  };
}

/** Call once per study session; increments streak if this is a new day. */
export function recordStudyToday(): StreakInfo {
  const today = todayStr();
  const current = getStreak();

  let nextStreak = current.currentStreak;
  if (current.lastStudyDate === today) {
    // already recorded today, no change
  } else if (current.lastStudyDate && daysBetween(current.lastStudyDate, today) === 1) {
    nextStreak = current.currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  db.runSync(
    `UPDATE streak SET last_study_date = ?, current_streak = ? WHERE id = 1;`,
    [today, nextStreak]
  );

  return { lastStudyDate: today, currentStreak: nextStreak };
}
