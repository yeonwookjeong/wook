import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { buildTodaySession, isDayFullyLearned } from '../lib/studyQueue';
import { getProgress, upsertProgress } from '../db/progress';
import { createInitialProgress, applyReview } from '../lib/sm2';
import { completeDay } from '../db/dayProgress';
import { recordStudyToday } from '../db/streak';
import { ReviewGrade, Word } from '../types';
import { HomeStackParamList } from '../navigation/types';

const LEVEL = 'N5';

type Props = NativeStackScreenProps<HomeStackParamList, 'StudySession'>;

interface Card {
  word: Word;
  isNew: boolean;
}

const GRADE_OPTIONS: { grade: ReviewGrade; label: string; color: string }[] = [
  { grade: 'again', label: '다시', color: '#ff5d5d' },
  { grade: 'hard', label: '어려움', color: '#ffb020' },
  { grade: 'good', label: '보통', color: '#3ecf8e' },
  { grade: 'easy', label: '쉬움', color: '#6d5bff' },
];

export default function StudySessionScreen({ navigation }: Props) {
  const [queue] = useState<Card[]>(() => {
    const session = buildTodaySession(LEVEL);
    return [
      ...session.dueWords.map((word) => ({ word, isNew: false })),
      ...session.newWords.map((word) => ({ word, isNew: true })),
    ];
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [day] = useState(() => buildTodaySession(LEVEL).day);

  const current = queue[index];
  const isDone = index >= queue.length;

  const progressLabel = `${Math.min(index + 1, queue.length)} / ${queue.length}`;

  function finishSession() {
    recordStudyToday();
    if (isDayFullyLearned(LEVEL, day)) {
      completeDay(LEVEL, day);
    }
    navigation.goBack();
  }

  function handleGrade(grade: ReviewGrade) {
    const existing = getProgress(current.word.id);
    const base = existing ?? createInitialProgress(current.word.id);
    const updated = applyReview(base, grade);
    upsertProgress(updated);

    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (queue.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneText}>오늘 학습할 단어가 없어요!</Text>
        <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>홈으로</Text>
        </Pressable>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneText}>오늘 학습 완료! 🎉</Text>
        <Pressable style={styles.doneButton} onPress={finishSession}>
          <Text style={styles.doneButtonText}>확인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.progress}>{progressLabel}</Text>

      <Pressable style={styles.card} onPress={() => setRevealed(true)}>
        {current.isNew && <Text style={styles.newBadge}>NEW</Text>}
        <Text style={styles.meaning}>{current.word.meaning}</Text>
        {revealed ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.expression}>{current.word.expression}</Text>
            <Text style={styles.reading}>{current.word.reading}</Text>
          </>
        ) : (
          <Text style={styles.tapHint}>탭해서 정답 보기</Text>
        )}
      </Pressable>

      {revealed && (
        <View style={styles.gradeRow}>
          {GRADE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.grade}
              style={[styles.gradeButton, { backgroundColor: opt.color }]}
              onPress={() => handleGrade(opt.grade)}
            >
              <Text style={styles.gradeButtonText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center', gap: 20 },
  progress: { textAlign: 'center', color: colors.subtext, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 32,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  meaning: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  tapHint: { color: colors.subtext, marginTop: 16, fontSize: 13 },
  divider: { width: '60%', height: 1, backgroundColor: colors.cardBorder, marginVertical: 16 },
  expression: { fontSize: 32, fontWeight: '800', color: colors.primary },
  reading: { fontSize: 16, color: colors.subtext, marginTop: 4 },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeButton: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  gradeButtonText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.bg },
  doneText: { fontSize: 20, fontWeight: '700', color: colors.text },
  doneButton: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  doneButtonText: { color: '#fff', fontWeight: '700' },
});
