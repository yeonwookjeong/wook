import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('wook.db');

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS word_progress (
      word_id TEXT PRIMARY KEY NOT NULL,
      interval INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at TEXT NOT NULL,
      last_result TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS day_progress (
      level TEXT NOT NULL,
      day INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (level, day)
    );

    CREATE TABLE IF NOT EXISTS wrong_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id TEXT NOT NULL,
      quiz_type TEXT NOT NULL,
      missed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS streak (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_study_date TEXT,
      current_streak INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.runSync(`INSERT OR IGNORE INTO streak (id, current_streak) VALUES (1, 0);`);
}

export default db;
