import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '../components/ui';
import { modules } from '../data/curriculum';
import { passages } from '../data/passages';
import { moduleStats } from '../lib/plan';
import { colors, displayFont, layout, radius, spacing, type } from '../theme';
import { Level } from '../types';
import { useStore } from '../state/store';

type Filter = 'all' | Level;

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 1, label: '起步' },
  { key: 2, label: '进阶' },
  { key: 3, label: '自如' },
];

export const LibraryScreen = ({
  onOpenModule,
  onOpenPassage,
}: {
  onOpenModule: (id: string) => void;
  onOpenPassage: (id: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const stats = useMemo(() => moduleStats(data.progress), [data.progress]);
  const visible = modules.filter((mod) => filter === 'all' || mod.level === filter);
  const totalPracticed = stats.reduce((sum, item) => sum + item.practiced, 0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>LIBRARY · 120 句 · 12 篇短文</Text>
      <Text style={styles.title}>句库</Text>
      <Text style={styles.lead}>
        八个发音要点，从连读到语调。每句都能单独精练，也可以整章顺下来。
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="layers-outline" size={13} color={colors.inkSoft} />
          <Text style={styles.metaText}>{modules.length} 个要点</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="checkmark-done-outline" size={13} color={colors.inkSoft} />
          <Text style={styles.metaText}>已练 {totalPracticed} 句</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <Pressable
              key={String(item.key)}
              onPress={() => setFilter(item.key)}
              style={[styles.filter, active && styles.filterActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 12, marginTop: spacing.sm }}>
        {visible.map((mod) => {
          const stat = stats.find((s) => s.id === mod.id);
          return (
            <Pressable
              key={mod.id}
              onPress={() => onOpenModule(mod.id)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`打开 ${mod.title} 章节`}
            >
              <View style={styles.cardTop}>
                <View style={styles.indexBox}>
                  <Text style={styles.indexText}>{String(mod.index).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{mod.title}</Text>
                    <Text style={styles.cardEn}>{mod.en}</Text>
                  </View>
                  <Text style={styles.cardSummary} numberOfLines={2}>
                    {mod.summary}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.faint} />
              </View>
              <View style={styles.progressRow}>
                <View style={{ flex: 1 }}>
                  <ProgressBar
                    value={((stat?.practiced ?? 0) / mod.sentences.length) * 100}
                    height={4}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.progressText}>
                  {stat?.practiced ?? 0}/{mod.sentences.length} 句
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.passageHeader}>
        <Text style={styles.passageTitle}>短文 · {passages.length} 篇</Text>
        <Text style={styles.passageHint}>整篇听，整篇读</Text>
      </View>
      <View style={styles.passageList}>
        {passages.map((passage) => (
          <Pressable
            key={passage.id}
            onPress={() => onOpenPassage(passage.id)}
            style={({ pressed }) => [styles.passageCard, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`打开短文 ${passage.title}`}
          >
            <View style={styles.passageIcon}>
              <Ionicons name="document-text-outline" size={17} color={colors.inkSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.passageTitleRow}>
                <Text style={styles.passageName}>{passage.title}</Text>
                <Text style={styles.passageEn}>{passage.en}</Text>
              </View>
              <Text style={styles.passageSummary} numberOfLines={2}>
                {passage.summary}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>每一句都配有 IPA、听感拆解和一个最小练习。</Text>
    </ScrollView>
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
  eyebrow: { ...type.caption, color: colors.muted, letterSpacing: 1.4 },
  title: {
    fontFamily: displayFont,
    fontSize: 38,
    color: colors.ink,
    marginTop: 8,
    letterSpacing: -0.8,
  },
  lead: { fontSize: 14, lineHeight: 22, color: colors.inkSoft, marginTop: 10, maxWidth: 370 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  metaText: { fontSize: 11, color: colors.inkSoft },
  filters: { gap: 8, paddingVertical: spacing.xl, paddingRight: spacing.lg },
  filter: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontSize: 12, color: colors.inkSoft },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  indexBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { fontFamily: displayFont, fontSize: 16, color: colors.inkSoft },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  cardEn: { fontSize: 10, color: colors.faint, letterSpacing: 0.6, textTransform: 'uppercase' },
  cardSummary: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  progressText: { fontSize: 10, color: colors.faint, minWidth: 46, textAlign: 'right' },
  passageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  passageTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  passageHint: { fontSize: 10, color: colors.faint },
  passageList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  passageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  passageIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passageTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  passageName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  passageEn: { fontSize: 9, color: colors.faint, letterSpacing: 0.4 },
  passageSummary: { fontSize: 11, lineHeight: 17, color: colors.muted, marginTop: 3 },
  footer: {
    fontSize: 11,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
});
