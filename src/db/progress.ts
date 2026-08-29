import db from './client';
import { ReviewGrade, WordProgress } from '../types';

function toWordProgress(row: any): WordProgress {
  return {
    wordId: row.word_id,
    interval: row.interval,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    nextReviewAt: row.next_review_at,
    lastResult: row.last_result,
    updatedAt: row.updated_at,
  };
}

export function getProgress(wordId: string): WordProgress | null {
  const row = db.getFirstSync<any>(
    `SELECT * FROM word_progress WHERE word_id = ?;`,
    [wordId]
  );
  return row ? toWordProgress(row) : null;
}

export function getAllProgress(): WordProgress[] {
  const rows = db.getAllSync<any>(`SELECT * FROM word_progress;`);
  return rows.map(toWordProgress);
}

export function getDueProgress(nowIso: string): WordProgress[] {
  const rows = db.getAllSync<any>(
    `SELECT * FROM word_progress WHERE next_review_at <= ? ORDER BY next_review_at ASC;`,
    [nowIso]
  );
  return rows.map(toWordProgress);
}

export function upsertProgress(progress: WordProgress) {
  db.runSync(
    `INSERT INTO word_progress (word_id, interval, ease_factor, repetitions, next_review_at, last_result, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(word_id) DO UPDATE SET
       interval = excluded.interval,
       ease_factor = excluded.ease_factor,
       repetitions = excluded.repetitions,
       next_review_at = excluded.next_review_at,
       last_result = excluded.last_result,
       updated_at = excluded.updated_at;`,
    [
      progress.wordId,
      progress.interval,
      progress.easeFactor,
      progress.repetitions,
      progress.nextReviewAt,
      progress.lastResult,
      progress.updatedAt,
    ]
  );
}

export function getLearnedWordIds(): Set<string> {
  const rows = db.getAllSync<{ word_id: string }>(
    `SELECT word_id FROM word_progress;`
  );
  return new Set(rows.map((r) => r.word_id));
}
