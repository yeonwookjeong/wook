import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { pickQuizTargets, getLearnedWords, buildQuizQuestion, QuizQuestion } from '../lib/quiz';
import { addWrongAnswer, clearWrongAnswer } from '../db/wrongAnswers';
import { TestStackParamList } from '../navigation/types';

const LEVEL = 'N5';

type Props = NativeStackScreenProps<TestStackParamList, 'QuizSession'>;

export default function QuizSessionScreen({ route, navigation }: Props) {
  const { mode } = route.params;

  const [targets] = useState(() => pickQuizTargets(mode, LEVEL));
  const pool = useMemo(() => getLearnedWords(LEVEL), []);
  const [questions] = useState<QuizQuestion[]>(() =>
    targets.map((word) => buildQuizQuestion(word, pool))
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const current = questions[index];
  const isDone = index >= questions.length;

  function handleSelect(wordId: string) {
    if (selected) return;
    setSelected(wordId);
    const correct = wordId === current.correctWordId;
    if (correct) {
      setScore((s) => s + 1);
      if (mode === 'wrong') clearWrongAnswer(current.word.id);
    } else {
      addWrongAnswer(current.word.id, current.type);
    }
  }

  function next() {
    setSelected(null);
    setIndex((i) => i + 1);
  }

  if (pool.length < 4 || questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>출제할 단어가 부족해요</Text>
        <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneTitle}>결과: {score} / {questions.length}</Text>
        <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>확인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.progress}>{index + 1} / {questions.length}</Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>{current.promptText}</Text>
      </View>

      <View style={styles.options}>
        {current.options.map((opt) => {
          const isSelected = selected === opt.wordId;
          const isCorrect = opt.wordId === current.correctWordId;
          const showState = selected !== null;
          return (
            <Pressable
              key={opt.key}
              style={[
                styles.option,
                showState && isCorrect && styles.optionCorrect,
                showState && isSelected && !isCorrect && styles.optionWrong,
              ]}
              onPress={() => handleSelect(opt.wordId)}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <Pressable style={styles.nextButton} onPress={next}>
          <Text style={styles.nextButtonText}>다음</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 16 },
  progress: { textAlign: 'center', color: colors.subtext, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 32,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  options: { gap: 10 },
  option: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  optionCorrect: { backgroundColor: '#e4faf0', borderColor: colors.success },
  optionWrong: { backgroundColor: '#ffecec', borderColor: colors.danger },
  optionText: { fontSize: 16, color: colors.text, textAlign: 'center' },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.bg },
  doneTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  doneButton: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  doneButtonText: { color: '#fff', fontWeight: '700' },
});
