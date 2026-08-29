import db from './client';
import { WrongAnswer } from '../types';

export function addWrongAnswer(wordId: string, quizType: string) {
  db.runSync(
    `INSERT INTO wrong_answers (word_id, quiz_type, missed_at) VALUES (?, ?, ?);`,
    [wordId, quizType, new Date().toISOString()]
  );
}

export function getWrongAnswers(): WrongAnswer[] {
  const rows = db.getAllSync<any>(
    `SELECT * FROM wrong_answers ORDER BY missed_at DESC;`
  );
  return rows.map((r) => ({
    id: r.id,
    wordId: r.word_id,
    quizType: r.quiz_type,
    missedAt: r.missed_at,
  }));
}

export function getWrongWordIds(): string[] {
  const rows = db.getAllSync<{ word_id: string }>(
    `SELECT DISTINCT word_id FROM wrong_answers;`
  );
  return rows.map((r) => r.word_id);
}

export function clearWrongAnswer(wordId: string) {
  db.runSync(`DELETE FROM wrong_answers WHERE word_id = ?;`, [wordId]);
}
