import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { buildTodaySession } from '../lib/studyQueue';
import { getMaxDay } from '../lib/words';
import { getStreak } from '../db/streak';
import { HomeStackParamList } from '../navigation/types';

const LEVEL = 'N5';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export default function HomeScreen({ navigation }: Props) {
  const [summary, setSummary] = useState({ day: 1, newCount: 0, dueCount: 0 });
  const [streak, setStreak] = useState(0);
  const maxDay = getMaxDay(LEVEL);

  useFocusEffect(
    useCallback(() => {
      const session = buildTodaySession(LEVEL);
      setSummary({
        day: session.day,
        newCount: session.newWords.length,
        dueCount: session.dueWords.length,
      });
      setStreak(getStreak().currentStreak);
    }, [])
  );

  const totalToday = summary.newCount + summary.dueCount;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
      </Text>
      <Text style={styles.title}>연속 {streak}일째, 오늘도!</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Day {summary.day} · N5</Text>
        <Text style={styles.heroCount}>
          복습 {summary.dueCount} · 새 단어 {summary.newCount}
        </Text>
        <Pressable
          style={styles.heroButton}
          disabled={totalToday === 0}
          onPress={() => navigation.navigate('StudySession')}
        >
          <Text style={styles.heroButtonText}>
            {totalToday === 0 ? '오늘 학습 완료!' : '오늘 학습 시작'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>진도</Text>
        <Text style={styles.cardValue}>Day {summary.day} / {maxDay}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  dateText: { color: colors.subtext, fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius,
    padding: 20,
    gap: 12,
  },
  heroLabel: { color: '#e5e1ff', fontSize: 13 },
  heroCount: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  heroButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  heroButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 18,
  },
  cardTitle: { color: colors.subtext, fontSize: 13, marginBottom: 6 },
  cardValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
