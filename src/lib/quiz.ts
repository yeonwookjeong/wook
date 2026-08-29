import { Word, Level } from '../types';
import { getWords } from './words';
import { getLearnedWordIds } from '../db/progress';
import { getWrongWordIds } from '../db/wrongAnswers';
import { QuizMode } from '../navigation/types';

export type QuizType = 'meaning-to-word' | 'word-to-meaning';

export interface QuizQuestion {
  type: QuizType;
  word: Word;
  promptText: string;
  options: { key: string; label: string; wordId: string }[];
  correctWordId: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QUIZ_LENGTH = 10;

export function getLearnedWords(level: Level): Word[] {
  const learnedIds = getLearnedWordIds();
  return getWords(level).filter((w) => learnedIds.has(w.id));
}

export function pickQuizTargets(mode: QuizMode, level: Level): Word[] {
  const learned = getLearnedWords(level);

  if (mode === 'wrong') {
    const wrongIds = new Set(getWrongWordIds());
    return learned.filter((w) => wrongIds.has(w.id));
  }

  if (mode === 'day') {
    const latestDay = learned.reduce((max, w) => Math.max(max, w.day), 0);
    return shuffle(learned.filter((w) => w.day === latestDay)).slice(0, QUIZ_LENGTH);
  }

  // shuffle mode: random sample across everything learned so far
  return shuffle(learned).slice(0, QUIZ_LENGTH);
}

export function buildQuizQuestion(target: Word, pool: Word[]): QuizQuestion {
  const type: QuizType = Math.random() < 0.5 ? 'meaning-to-word' : 'word-to-meaning';

  const distractors = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, 3);
  const options = shuffle([target, ...distractors]).map((w) => ({
    key: w.id,
    label: type === 'meaning-to-word' ? `${w.expression} (${w.reading})` : w.meaning,
    wordId: w.id,
  }));

  return {
    type,
    word: target,
    promptText: type === 'meaning-to-word' ? target.meaning : `${target.expression} (${target.reading})`,
    options,
    correctWordId: target.id,
  };
}
