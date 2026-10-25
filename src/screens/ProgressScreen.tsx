import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ProgressBar, SectionTitle, WaveMark } from '../components/ui';
import { dateKey, lastNDays, monthDay } from '../lib/dates';
import {
  MASTERED_AT,
  moduleStats,
  masteredCount,
  overallMastery,
  streakOf,
} from '../lib/plan';
import { colors, displayFont, layout, radius, spacing, type } from '../theme';
import { useStore } from '../state/store';

export const ProgressScreen = ({
  onOpenModule,
  onOpenSettings,
}: {
  onOpenModule: (id: string) => void;
  onOpenSettings: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const today = dateKey();
  const streak = streakOf(data.days, today);
  const practiced = Object.keys(data.progress).length;
  const mastered = masteredCount(data.progress);
  const mastery = overallMastery(data.progress);
  const totalSentences = Object.values(data.days).reduce((sum, d) => sum + d.completed.length, 0);
  const minutes = Object.values(data.days).reduce((sum, d) => sum + d.minutes, 0);
  const stats = useMemo(() => moduleStats(data.progress), [data.progress]);
  const weak = [...stats].sort((a, b) => a.mastery - b.mastery || a.index - b.index)[0];

  const days = lastNDays(14, today);
  const counts = days.map((day) => data.days[day]?.completed.length ?? 0);
  const max = Math.max(1, ...counts);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.title}>进度</Text>
        </View>
        <Pressable
          onPress={onOpenSettings}
          style={styles.iconButton}
          hitSlop={8}
          accessibilityLabel="打开设置"
        >
          <Ionicons name="settings-outline" size={19} color={colors.inkSoft} />
        </Pressable>
      </View>

      <Card tone="forest" style={styles.summary}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryEyebrow}>连续练习</Text>
            <View style={styles.streakValueRow}>
              <Text style={styles.streakValue}>{streak}</Text>
              <Text style={styles.streakUnit}>天</Text>
            </View>
          </View>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={22} color="#F0A183" />
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStats}>
          <SummaryStat value={String(practiced)} label="练过的句子" />
          <SummaryStat value={`${mastery}%`} label="平均掌握" />
          <SummaryStat value={String(minutes)} label="累计分钟" />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionTitle title="最近 14 天" />
        <Card style={styles.chartCard}>
          {totalSentences === 0 ? (
            <View style={styles.emptyChart}>
              <WaveMark color={colors.lineStrong} height={24} bars={5} />
              <Text style={styles.emptyTitle}>还没有练习记录</Text>
              <Text style={styles.emptyBody}>完成今天的句子，这里会慢慢亮起来。</Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {days.map((day, index) => {
                const count = counts[index];
                const isToday = day === today;
                return (
                  <View key={day} style={styles.chartCol}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: Math.max(4, (count / max) * 54),
                          backgroundColor: isToday ? colors.accent : colors.forestLight,
                          opacity: count === 0 ? 0.18 : 1,
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          )}
          <View style={styles.chartFooter}>
            <Text style={styles.chartCaption}>
              {monthDay(days[0])} – {monthDay(today)}
            </Text>
            <Text style={styles.chartDate}>
              {totalSentences} 次 · 掌握 {mastered} 句
            </Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="发音要点" />
        <View style={styles.moduleList}>
          {stats.map((item) => {
            const done = item.mastery >= MASTERED_AT;
            return (
              <Pressable
                key={item.id}
                onPress={() => onOpenModule(item.id)}
                style={({ pressed }) => [styles.moduleRow, pressed && { opacity: 0.65 }]}
              >
                <Text style={styles.moduleIndex}>{String(item.index).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.moduleTitleRow}>
                    <Text style={styles.moduleTitle}>{item.title}</Text>
                    {done ? (
                      <Ionicons name="checkmark-circle" size={13} color={colors.forestLight} />
                    ) : null}
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <ProgressBar
                      value={item.mastery}
                      height={4}
                      color={done ? colors.forestLight : colors.accent}
                      track={colors.line}
                    />
                  </View>
                </View>
                <Text style={styles.modulePercent}>{item.mastery}%</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {weak ? (
        <View style={styles.section}>
          <SectionTitle title="下一步" />
          <Card style={styles.nextCard}>
            <View style={styles.nextTop}>
              <View style={styles.nextBadge}>
                <Ionicons name="compass-outline" size={15} color={colors.accentDark} />
              </View>
              <Text style={styles.nextLabel}>最值得补的一块</Text>
            </View>
            <Text style={styles.nextTitle}>
              {weak.title} · {weak.mastery}%
            </Text>
            <Text style={styles.nextBody}>
              这一章还有 {weak.total - weak.practiced} 句没练，已经练过的也可以再回来听一遍。
            </Text>
            <Pressable style={styles.nextCta} onPress={() => onOpenModule(weak.id)}>
              <Text style={styles.nextCtaText}>去练这一章</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.ink} />
            </Pressable>
          </Card>
        </View>
      ) : null}

      <View style={styles.memoryCard}>
        <Ionicons name="repeat-outline" size={17} color={colors.muted} />
        <Text style={styles.memoryText}>
          Echo 用简单的间隔重复安排复习：练得顺的句子隔几天再见，卡住的句子明天就回来。
        </Text>
      </View>
    </ScrollView>
  );
};

const SummaryStat = ({ value, label }: { value: string; label: string }) => (
  <View style={{ flex: 1 }}>
    <Text style={styles.summaryStatValue}>{value}</Text>
    <Text style={styles.summaryStatLabel}>{label}</Text>
  </View>
);

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
  eyebrow: { ...type.caption, color: colors.muted, letterSpacing: 1.4 },
  title: {
    fontFamily: displayFont,
    fontSize: 38,
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { marginTop: spacing.xl, padding: spacing.xl },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryEyebrow: { fontSize: 10, letterSpacing: 1.4, color: '#9DB3A4' },
  streakValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  streakValue: { fontFamily: displayFont, fontSize: 44, color: colors.white, lineHeight: 50 },
  streakUnit: { fontSize: 12, color: '#B9C9BE' },
  flameCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E4A3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3A5646', marginVertical: 16 },
  summaryStats: { flexDirection: 'row' },
  summaryStatValue: { fontFamily: displayFont, fontSize: 19, color: colors.white },
  summaryStatLabel: { fontSize: 9, color: '#9DB3A4', marginTop: 3 },
  section: { marginTop: spacing.xxl },
  chartCard: { padding: spacing.lg },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 74, gap: 3 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: '100%', maxWidth: 12, borderRadius: 3 },
  emptyChart: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginTop: 4 },
  emptyBody: { fontSize: 10, color: colors.faint },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  chartCaption: { fontSize: 10, color: colors.muted },
  chartDate: { fontSize: 10, color: colors.faint },
  moduleList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  moduleIndex: { fontFamily: displayFont, fontSize: 12, color: colors.faint, width: 20 },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  moduleTitle: { fontSize: 14, fontWeight: '500', color: colors.ink },
  modulePercent: { fontFamily: displayFont, fontSize: 13, color: colors.muted, width: 38, textAlign: 'right' },
  nextCard: { padding: spacing.xl, backgroundColor: colors.accentSoft, borderColor: '#F0D3C5' },
  nextTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3CDBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: { fontSize: 10, letterSpacing: 1.1, color: colors.accentDark, fontWeight: '600' },
  nextTitle: { fontFamily: displayFont, fontSize: 24, color: colors.ink, marginTop: 12 },
  nextBody: { fontSize: 12, lineHeight: 19, color: colors.inkSoft, marginTop: 6 },
  nextCta: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  nextCtaText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  memoryCard: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  memoryText: { flex: 1, fontSize: 11, lineHeight: 18, color: colors.muted },
});
