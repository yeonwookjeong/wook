export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Word {
  id: string;
  level: Level;
  day: number;
  expression: string;
  reading: string;
  meaning: string;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface WordProgress {
  wordId: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string; // ISO date string
  lastResult: ReviewGrade | null;
  updatedAt: string;
}

export interface DayProgress {
  level: Level;
  day: number;
  completedAt: string;
}

export interface WrongAnswer {
  id: number;
  wordId: string;
  quizType: string;
  missedAt: string;
}

export interface StreakInfo {
  lastStudyDate: string | null;
  currentStreak: number;
}
