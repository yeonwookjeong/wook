import { ReviewGrade, WordProgress } from '../types';

const MIN_EASE_FACTOR = 1.3;

// SM-2 quality mapping: again=0, hard=3, good=4, easy=5 (skips 1-2, unused here)
const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function createInitialProgress(wordId: string, now: Date = new Date()): WordProgress {
  return {
    wordId,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewAt: now.toISOString(),
    lastResult: null,
    updatedAt: now.toISOString(),
  };
}

/** Applies one SM-2 review step and returns the updated progress (does not mutate input). */
export function applyReview(
  progress: WordProgress,
  grade: ReviewGrade,
  now: Date = new Date()
): WordProgress {
  const quality = GRADE_QUALITY[grade];

  let { repetitions, easeFactor, interval } = progress;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    wordId: progress.wordId,
    interval,
    easeFactor: newEaseFactor,
    repetitions,
    nextReviewAt: nextReviewAt.toISOString(),
    lastResult: grade,
    updatedAt: now.toISOString(),
  };
}
