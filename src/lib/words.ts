import n5Data from '../data/n5.json';
import { Level, Word } from '../types';

const WORDS_BY_LEVEL: Record<Level, Word[]> = {
  N5: n5Data as Word[],
  N4: [],
  N3: [],
  N2: [],
  N1: [],
};

export function getWords(level: Level): Word[] {
  return WORDS_BY_LEVEL[level];
}

export function getWordsByDay(level: Level, day: number): Word[] {
  return getWords(level).filter((w) => w.day === day);
}

export function getWordById(id: string): Word | undefined {
  for (const words of Object.values(WORDS_BY_LEVEL)) {
    const found = words.find((w) => w.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getMaxDay(level: Level): number {
  const words = getWords(level);
  return words.reduce((max, w) => Math.max(max, w.day), 0);
}
