import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, EchoText, ProgressBar, SectionTitle, WaveMark } from '../components/ui';
import { moduleById, plainText, sentenceById } from '../data/curriculum';
import { dateKey, greeting, lastNDays, monthDay, weekdayShort } from '../lib/dates';
import { moduleStats, planSize, streakOf } from '../lib/plan';
import { colors, displayFont, layout, radius, spacing, type } from '../theme';
import { useStore } from '../state/store';

export const HomeScreen = ({
  onPractice,
  onOpenModule,
  onOpenSettings,
  onOpenLibrary,
  onOpenProgress,
}: {
  onPractice: (ids: string[], title: string, source?: 'plan' | 'library', startIndex?: number) => void;
  onOpenModule: (id: string) => void;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onOpenProgress: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const today = dateKey();
  const plan = data.plan;
  const ids = plan?.sentenceIds ?? [];
  const doneToday = data.days[today]?.completed ?? [];
  const completedCount = ids.filter((id) => doneToday.includes(id)).length;
  const allDone = ids.length > 0 && completedCount === ids.length;
  const nextIndex = ids.findIndex((id) => !doneToday.includes(id));
  const startIndex = nextIndex === -1 ? 0 : nextIndex;

  const streak = streakOf(data.days, today);
  const minutes = Math.round(planSize(data.profile.dailyMinutes) * 1.6);
  const stats = useMemo(() => moduleStats(data.progress), [data.progress]);
  const weak = [...stats].sort((a, b) => a.mastery - b.mastery || a.index - b.index).slice(0, 3);
  const week = lastNDays(7, today);
  const weekCounts = week.map((day) => data.days[day]?.completed.length ?? 0);
  const weekMax = Math.max(1, ...weekCounts);

  const total = data.days[today]?.minutes ?? 0;
  const focusLine = Array.from(
    new Set(
      ids
        .map((id) => sentenceById[id]?.moduleId)
        .filter((moduleId): moduleId is string => Boolean(moduleId))
    )
  )
    .slice(0, 2)
    .map((moduleId) => moduleById[moduleId]?.title)
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLine}>
              {monthDay(today)} · 星期{weekdayShort(today)}
            </Text>
            <Text style={styles.greeting}>{greeting()}，同学</Text>
          </View>
          <Pressable
            onPress={onOpenSettings}
            style={styles.settingsButton}
            hitSlop={8}
            accessibilityLabel="打开设置"
          >
            <Ionicons name="settings-outline" size={19} color={colors.inkSoft} />
          </Pressable>
        </View>

        <View style={styles.streakRow}>
          <View style={styles.streakChip}>
            <Ionicons name="flame" size={13} color={colors.accent} />
            <Text style={styles.streakText}>
              {streak > 0 ? `连续 ${streak} 天` : '今天开始第一天'}
            </Text>
          </View>
          <Text style={styles.streakHint}>
            {allDone ? '今天的任务已经完成' : `还有 ${Math.max(ids.length - completedCount, 0)} 句`}
          </Text>
        </View>

        <Card tone="forest" style={styles.hero}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>TODAY'S SESSION</Text>
            <WaveMark color="#8FAE9A" height={20} bars={4} />
          </View>
          <Text style={styles.heroTitle}>
            {allDone ? '今天，练完了。' : `今日 ${ids.length} 句`}
          </Text>
          <Text style={styles.heroSub}>
            {allDone
              ? '复习会按记忆曲线自动回来，明天见。'
              : `${focusLine || '发音基础'} · 约 ${minutes} 分钟`}
          </Text>

          <View style={styles.segments}>
            {ids.map((id) => {
              const done = doneToday.includes(id);
              return <View key={id} style={[styles.segment, done && styles.segmentDone]} />;
            })}
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroProgress}>
              {completedCount} / {ids.length} 已完成
              {total > 0 ? ` · 今日 ${total} 分钟` : ''}
            </Text>
            <Pressable
              style={styles.heroCta}
              onPress={() => onPractice(ids, allDone ? '今日复习' : '今日练习', 'plan', startIndex)}
            >
              <Text style={styles.heroCtaText}>{allDone ? '再练一轮' : '继续练习'}</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.forest} />
            </Pressable>
          </View>
        </Card>

        <View style={styles.section}>
          <SectionTitle title="今日清单" action="全部句库" onAction={onOpenLibrary} />
          <View style={styles.listCard}>
            {ids.map((id, index) => {
              const sentence = sentenceById[id];
              if (!sentence) return null;
              const done = doneToday.includes(id);
              const progressItem = data.progress[id];
              const isReview = Boolean(progressItem && progressItem.lastPracticedAt < today);
              return (
                <Pressable
                  key={id}
                  onPress={() => onPractice(ids, allDone ? '今日复习' : '今日练习', 'plan', index)}
                  style={({ pressed }) => [styles.taskRow, pressed && { opacity: 0.6 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`练习 ${plainText(sentence.text)}`}
                >
                  <View style={[styles.taskIndex, done && styles.taskIndexDone]}>
                    {done ? (
                      <Ionicons name="checkmark" size={13} color={colors.white} />
                    ) : (
                      <Text style={styles.taskIndexText}>{String(index + 1).padStart(2, '0')}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.taskSentence, done && styles.taskSentenceDone]}
                      numberOfLines={1}
                    >
                      {plainText(sentence.text)}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {isReview ? '复习' : '新句'} · {sentence.focus}
                      {progressItem ? ` · ${Math.round(progressItem.mastery)}%` : ''}
                    </Text>
                  </View>
                  {done ? null : (
                    <Ionicons name="play-circle-outline" size={22} color={colors.lineStrong} />
                  )}
                </Pressable>
              );
            })}
            {ids.length === 0 ? (
              <Text style={styles.emptyText}>正在为你准备今天的练习…</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="哪里还卡" action="看进度" onAction={onOpenProgress} />
          <View style={styles.weakList}>
            {weak.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onOpenModule(item.id)}
                style={({ pressed }) => [styles.weakCard, pressed && { opacity: 0.65 }]}
              >
                <View style={styles.weakTop}>
                  <Text style={styles.weakTitle}>{item.title}</Text>
                  <Text style={styles.weakPercent}>{item.mastery}%</Text>
                </View>
                <ProgressBar value={item.mastery} height={4} color={colors.ink} track={colors.line} />
                <Text style={styles.weakMeta}>
                  已练 {item.practiced} / {item.total} 句
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="这周" action="详细统计" onAction={onOpenProgress} />
          <Card style={styles.weekCard}>
            <View style={styles.weekBars}>
              {week.map((day, index) => {
                const count = weekCounts[index];
                const isToday = day === today;
                return (
                  <View key={day} style={styles.weekCol}>
                    <View style={styles.weekBarTrack}>
                      <View
                        style={[
                          styles.weekBar,
                          {
                            height: Math.max(4, Math.round((count / weekMax) * 46)),
                            backgroundColor: isToday ? colors.accent : count > 0 ? colors.forestLight : colors.line,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>
                      {weekdayShort(day)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weekFooter}>
              <EchoText variant="small">
                {weekCounts.reduce((a, b) => a + b, 0)} 句 · 7 天
              </EchoText>
              <Text style={styles.weekQuote}>Slow is smooth.</Text>
            </View>
          </Card>
        </View>

        <Text style={styles.footerNote}>Echo · 每天一点点，嘴型会记住的。</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: layout.gutter,
    paddingBottom: 120,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateLine: { ...type.caption, color: colors.muted, letterSpacing: 0.8 },
  greeting: {
    fontFamily: displayFont,
    fontSize: 30,
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  streakText: { fontSize: 11, color: colors.accentDark, fontWeight: '600' },
  streakHint: { fontSize: 11, color: colors.muted },
  hero: {
    padding: spacing.xl + 2,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#2E4A3B',
    right: -50,
    top: -60,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#3A5646',
    right: 14,
    bottom: -30,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: '#9DB3A4',
    fontWeight: '600',
  },
  heroTitle: {
    fontFamily: displayFont,
    fontSize: 32,
    color: colors.white,
    marginTop: 16,
    letterSpacing: -0.4,
  },
  heroSub: { fontSize: 12, color: '#B9C9BE', marginTop: 6, lineHeight: 18 },
  segments: { flexDirection: 'row', gap: 4, marginTop: 22 },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A5646',
  },
  segmentDone: { backgroundColor: '#E9B69F' },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroProgress: { fontSize: 11, color: '#9DB3A4', flexShrink: 1 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  heroCtaText: { fontSize: 13, fontWeight: '700', color: colors.forest },
  section: { marginTop: spacing.xxl + 4 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  taskIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIndexDone: { backgroundColor: colors.forestLight },
  taskIndexText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  taskSentence: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  taskSentenceDone: { color: colors.muted, textDecorationLine: 'line-through' },
  taskMeta: { fontSize: 10, color: colors.faint, marginTop: 3 },
  emptyText: { padding: spacing.xl, fontSize: 13, color: colors.muted },
  weakList: { flexDirection: 'row', gap: 10 },
  weakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 14,
  },
  weakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  weakTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  weakPercent: { fontFamily: displayFont, fontSize: 14, color: colors.muted },
  weakMeta: { fontSize: 9, color: colors.faint, marginTop: 7 },
  weekCard: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  weekBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  weekCol: { flex: 1, alignItems: 'center' },
  weekBarTrack: { height: 50, justifyContent: 'flex-end' },
  weekBar: { width: 16, borderRadius: 4 },
  weekLabel: { fontSize: 10, color: colors.faint, marginTop: 8 },
  weekLabelToday: { color: colors.accent, fontWeight: '700' },
  weekFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  weekQuote: { fontFamily: displayFont, fontSize: 12, color: colors.faint, fontStyle: 'italic' },
  footerNote: {
    fontSize: 11,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.xxl,
    letterSpacing: 0.3,
  },
});
