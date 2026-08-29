import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { getWrongAnswers } from '../db/wrongAnswers';
import { getLearnedWordIds } from '../db/progress';
import { TestStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TestStackParamList, 'TestMain'>;

export default function TestScreen({ navigation }: Props) {
  const [wrongCount, setWrongCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const wrong = getWrongAnswers();
      const uniqueWrong = new Set(wrong.map((w) => w.wordId));
      setWrongCount(uniqueWrong.size);
      setLearnedCount(getLearnedWordIds().size);
    }, [])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>시험</Text>

      <Pressable
        style={styles.row}
        disabled={learnedCount < 4}
        onPress={() => navigation.navigate('QuizSession', { mode: 'day' })}
      >
        <View>
          <Text style={styles.rowTitle}>오늘 배운 단어 퀴즈</Text>
          <Text style={styles.rowSubtitle}>최근 학습한 단어 위주 객관식</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.row}
        disabled={learnedCount < 4}
        onPress={() => navigation.navigate('QuizSession', { mode: 'shuffle' })}
      >
        <View>
          <Text style={styles.rowTitle}>셔플 테스트</Text>
          <Text style={styles.rowSubtitle}>지금까지 배운 단어 중 랜덤 출제</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable
        style={styles.row}
        disabled={wrongCount === 0}
        onPress={() => navigation.navigate('QuizSession', { mode: 'wrong' })}
      >
        <View>
          <Text style={styles.rowTitle}>오답노트</Text>
          <Text style={styles.rowSubtitle}>{wrongCount}개 · 모아서 다시 풀기</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {learnedCount < 4 && (
        <Text style={styles.hint}>퀴즈를 보려면 홈에서 단어를 4개 이상 먼저 학습하세요.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  chevron: { fontSize: 20, color: colors.subtext },
  hint: { color: colors.subtext, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
