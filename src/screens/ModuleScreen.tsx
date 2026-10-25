import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, EchoText, Pill, ProgressBar } from '../components/ui';
import { moduleById, plainText } from '../data/curriculum';
import { MASTERED_AT } from '../lib/plan';
import { colors, displayFont, ipaFont, layout, radius, spacing } from '../theme';
import { SentenceProgress } from '../types';
import { useStore } from '../state/store';

export const ModuleScreen = ({
  moduleId,
  onBack,
  onPracticeSentence,
  onPracticeAll,
}: {
  moduleId: string;
  onBack: () => void;
  onPracticeSentence: (id: string) => void;
  onPracticeAll: (ids: string[], title: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const mod = moduleById[moduleId];
  if (!mod) return null;

  const progressValues = mod.sentences
    .map((s) => data.progress[s.id])
    .filter((p): p is SentenceProgress => Boolean(p));
  const mastery = progressValues.length
    ? Math.round(
        progressValues.reduce((sum, p) => sum + p.mastery, 0) / mod.sentences.length
      )
    : 0;
  const practiced = progressValues.length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={8} accessibilityLabel="返回">
          <Ionicons name="arrow-back" size={19} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerLabel}>第 {String(mod.index).padStart(2, '0')} 章</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.en}>{mod.en.toUpperCase()}</Text>
        <Text style={styles.title}>{mod.title}</Text>
        <Text style={styles.summary}>{mod.summary}</Text>
      </View>

      <Card style={styles.statCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{mastery}%</Text>
          <Text style={styles.statLabel}>平均掌握</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {practiced}
            <Text style={styles.statUnit}>/{mod.sentences.length}</Text>
          </Text>
          <Text style={styles.statLabel}>已练句子</Text>
        </View>
        <View style={styles.statLine} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>L{mod.level}</Text>
          <Text style={styles.statLabel}>难度</Text>
        </View>
      </Card>

      <Button
        label={`整章顺一遍 · ${mod.sentences.length} 句`}
        icon="play"
        variant="dark"
        onPress={() =>
          onPracticeAll(mod.sentences.map((s) => s.id), `${mod.title} · 整章`)
        }
        style={{ marginTop: spacing.lg }}
      />
      <Text style={styles.ctaHint}>按顺序练完，中途可以随时退出</Text>

      <View style={styles.listHeader}>
        <EchoText variant="h3">本章句子</EchoText>
        <Text style={styles.listCount}>{mod.sentences.length} 句</Text>
      </View>

      <View style={styles.list}>
        {mod.sentences.map((sentence, index) => {
          const p = data.progress[sentence.id];
          const mastered = (p?.mastery ?? 0) >= MASTERED_AT;
          return (
            <Pressable
              key={sentence.id}
              onPress={() => onPracticeSentence(sentence.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.rowIndex, mastered && styles.rowIndexMastered]}>
                {mastered ? (
                  <Ionicons name="checkmark" size={13} color={colors.white} />
                ) : (
                  <Text style={styles.rowIndexText}>{index + 1}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowSentence} numberOfLines={2}>
                  {plainText(sentence.text)}
                </Text>
                <View style={styles.rowMeta}>
                  <Pill label={sentence.focus} tone="neutral" />
                  <Text style={styles.rowIpa} numberOfLines={1}>
                    /{sentence.ipa}/
                  </Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <ProgressBar
                    value={p?.mastery ?? 0}
                    height={3}
                    color={mastered ? colors.forestLight : colors.accent}
                  />
                </View>
              </View>
              <Ionicons name="play-circle-outline" size={23} color={colors.lineStrong} />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footer}>先听懂，再模仿，最后录下来对比。别急着追求速度。</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: layout.gutter,
    paddingBottom: 60,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: { fontSize: 11, color: colors.muted, letterSpacing: 1.5 },
  titleBlock: { marginTop: spacing.xl },
  en: { fontSize: 10, letterSpacing: 2, color: colors.accent, fontWeight: '600' },
  title: {
    fontFamily: displayFont,
    fontSize: 40,
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.8,
  },
  summary: { fontSize: 14, lineHeight: 22, color: colors.inkSoft, marginTop: 10, maxWidth: 360 },
  statCard: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: displayFont, fontSize: 24, color: colors.ink },
  statUnit: { fontSize: 14, color: colors.muted },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
  statLine: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: colors.line },
  ctaHint: { fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: 10 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  listCount: { fontSize: 11, color: colors.muted },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowIndexMastered: { backgroundColor: colors.forestLight },
  rowIndexText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  rowSentence: { fontSize: 16, lineHeight: 23, color: colors.ink, fontWeight: '500' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  rowIpa: { flex: 1, fontFamily: ipaFont, fontSize: 10, color: colors.muted },
  footer: {
    fontSize: 11,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
});
