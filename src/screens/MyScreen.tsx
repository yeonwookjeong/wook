import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius } from '../theme';
import { getStreak } from '../db/streak';
import { getCompletedDays } from '../db/dayProgress';
import { getLearnedWordIds } from '../db/progress';
import { getMaxDay, getWords } from '../lib/words';

const LEVEL = 'N5';

export default function MyScreen() {
  const [streak, setStreak] = useState(0);
  const [completedDays, setCompletedDays] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setStreak(getStreak().currentStreak);
      setCompletedDays(getCompletedDays(LEVEL).length);
      setLearnedCount(getLearnedWordIds().size);
    }, [])
  );

  const maxDay = getMaxDay(LEVEL);
  const totalWords = getWords(LEVEL).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>마이페이지</Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>완료한 Day</Text>
          <Text style={styles.statValue}>{completedDays} <Text style={styles.statValueSub}>/ {maxDay}</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>연속 학습</Text>
          <Text style={styles.statValue}>{streak} <Text style={styles.statValueSub}>일</Text></Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>학습한 단어</Text>
        <Text style={styles.cardValue}>{learnedCount} / {totalWords}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius, padding: 18 },
  statLabel: { color: colors.subtext, fontSize: 13, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statValueSub: { fontSize: 14, fontWeight: '400', color: colors.subtext },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 18 },
  cardTitle: { color: colors.subtext, fontSize: 13, marginBottom: 6 },
  cardValue: { fontSize: 18, fontWeight: '700', color: colors.text },
});
