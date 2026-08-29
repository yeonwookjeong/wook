import db from './client';
import { DayProgress, Level } from '../types';

export function completeDay(level: Level, day: number) {
  db.runSync(
    `INSERT OR IGNORE INTO day_progress (level, day, completed_at) VALUES (?, ?, ?);`,
    [level, day, new Date().toISOString()]
  );
}

export function getCompletedDays(level: Level): number[] {
  const rows = db.getAllSync<{ day: number }>(
    `SELECT day FROM day_progress WHERE level = ? ORDER BY day ASC;`,
    [level]
  );
  return rows.map((r) => r.day);
}

export function isDayCompleted(level: Level, day: number): boolean {
  const row = db.getFirstSync<DayProgress>(
    `SELECT * FROM day_progress WHERE level = ? AND day = ?;`,
    [level, day]
  );
  return !!row;
}
