import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecorderPanel } from '../components/RecorderPanel';
import { RichSentence } from '../components/RichSentence';
import { Card, Pill, WaveMark } from '../components/ui';
import { passageById, passageText } from '../data/passages';
import { tapFeedback } from '../lib/haptics';
import { usePlayback } from '../lib/usePlayback';
import { colors, displayFont, layout, radius, spacing } from '../theme';
import { useStore } from '../state/store';

export const PassageScreen = ({
  passageId,
  onBack,
}: {
  passageId: string;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const passage = passageById[passageId];
  const [slow, setSlow] = useState(false);

  const playback = usePlayback({
    id: passage?.id ?? '',
    text: passage ? passageText(passage) : '',
    rate: data.settings.rate,
    slow,
    autoPlay: data.settings.autoPlay,
  });

  if (!passage) return null;

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
        <Text style={styles.headerLabel}>SHORT PASSAGE</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={styles.en}>{passage.en.toUpperCase()}</Text>
      <Text style={styles.title}>{passage.title}</Text>
      <Text style={styles.summary}>{passage.summary}</Text>

      <View style={styles.metaRow}>
        <Pill label={passage.focus} tone="forest" />
        <Text style={styles.level}>{'●'.repeat(passage.level)}{'○'.repeat(3 - passage.level)}</Text>
      </View>

      <Card tone="forest" style={styles.audioCard}>
        <View style={styles.audioTop}>
          <Pressable
            onPress={() => {
              tapFeedback();
              playback.play();
            }}
            style={styles.playButton}
            accessibilityLabel="播放短文"
          >
            <Ionicons
              name={playback.playing ? 'pause' : 'play'}
              size={26}
              color={colors.forest}
              style={{ marginLeft: playback.playing ? 0 : 3 }}
            />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.audioTitle}>
              {playback.playing ? '正在播放…' : '听整篇'}
            </Text>
            <Text style={styles.audioSub}>
              {slow ? '慢速 · 先听清每句连接' : '原速 · 注意语气和停顿'}
            </Text>
          </View>
          <View style={styles.speedToggle}>
            <Pressable
              onPress={() => setSlow(false)}
              style={[styles.speedItem, !slow && styles.speedItemActive]}
            >
              <Text style={[styles.speedText, !slow && styles.speedTextActive]}>1×</Text>
            </Pressable>
            <Pressable
              onPress={() => setSlow(true)}
              style={[styles.speedItem, slow && styles.speedItemActive]}
            >
              <Text style={[styles.speedText, slow && styles.speedTextActive]}>0.75×</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.waveRow}>
          <WaveMark color="#8FAE9A" height={20} bars={5} />
          <Text style={styles.waveHint}>先整篇听两遍，再逐句跟读</Text>
        </View>
      </Card>

      <View style={styles.transcript}>
        {passage.lines.map((line, index) => (
          <View key={`${passage.id}-${index}`} style={styles.lineRow}>
            <Text style={styles.speaker}>{line.speaker}</Text>
            <RichSentence text={line.text} style={styles.lineText} linkColor={colors.accentDark} />
          </View>
        ))}
      </View>

      <Card tone="accent" style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="ear-outline" size={16} color={colors.accentDark} />
          <Text style={styles.tipLabel}>这一篇怎么练</Text>
        </View>
        <Text style={styles.tipText}>{passage.tip}</Text>
      </Card>

      <RecorderPanel />

      <Pressable style={styles.doneButton} onPress={onBack}>
        <Text style={styles.doneText}>练完了，返回</Text>
      </Pressable>

      <Text style={styles.footer}>短文音频为云端口语合成音，首次播放需要联网。</Text>
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
  headerLabel: { fontSize: 10, color: colors.muted, letterSpacing: 1.6 },
  en: { fontSize: 10, letterSpacing: 2, color: colors.accent, fontWeight: '600', marginTop: spacing.xl },
  title: {
    fontFamily: displayFont,
    fontSize: 34,
    color: colors.ink,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  summary: { fontSize: 13, lineHeight: 21, color: colors.inkSoft, marginTop: 8, maxWidth: 370 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  level: { fontSize: 8, color: colors.lineStrong, letterSpacing: 2 },
  audioCard: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg },
  audioTop: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitle: { fontSize: 15, fontWeight: '600', color: colors.white },
  audioSub: { fontSize: 10, color: '#B9C9BE', marginTop: 4 },
  speedToggle: { flexDirection: 'row', backgroundColor: '#2E4A3B', borderRadius: radius.pill, padding: 3 },
  speedItem: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill },
  speedItemActive: { backgroundColor: colors.white },
  speedText: { fontSize: 10, color: '#B9C9BE', fontWeight: '600' },
  speedTextActive: { color: colors.forest },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  waveHint: { fontSize: 9, color: '#9DB3A4' },
  transcript: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: 14,
  },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  speaker: {
    width: 18,
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 4,
  },
  lineText: { flex: 1, fontSize: 16, lineHeight: 25 },
  tipCard: { marginTop: spacing.md, backgroundColor: colors.accentSoft, borderColor: '#F0D3C5' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: colors.accentDark },
  tipText: { fontSize: 13, lineHeight: 21, color: colors.ink, marginTop: 10 },
  doneButton: {
    marginTop: spacing.xxl,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 13, color: colors.inkSoft, fontWeight: '500' },
  footer: { fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: spacing.lg },
});
