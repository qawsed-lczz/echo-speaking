import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RichSentence } from '../components/RichSentence';
import { Card, Pill, ProgressBar, WaveMark } from '../components/ui';
import { moduleOfSentence, plainText, sentenceById } from '../data/curriculum';
import { dateKey } from '../lib/dates';
import { successFeedback, tapFeedback } from '../lib/haptics';
import { MASTERED_AT, streakOf } from '../lib/plan';
import { speakSentence, stopSpeaking } from '../lib/speech';
import { colors, displayFont, ipaFont, layout, radius, spacing, type } from '../theme';
import { Rating } from '../types';
import { useStore } from '../state/store';
import { RecorderPanel } from '../components/RecorderPanel';

const ratings: { value: Rating; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 0, label: '再来一次', hint: '没跟上', icon: 'refresh-outline' },
  { value: 1, label: '还行', hint: '有点卡', icon: 'remove-outline' },
  { value: 2, label: '很顺', hint: '跟上了', icon: 'checkmark-outline' },
];

export const LessonScreen = ({
  ids,
  title,
  source,
  startIndex = 0,
  onClose,
  onPracticeAgain,
}: {
  ids: string[];
  title: string;
  source: 'plan' | 'library';
  startIndex?: number;
  onClose: () => void;
  onPracticeAgain: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { data, completeSentence } = useStore();
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(ids.length - 1, 0)));
  const [sessionSize, setSessionSize] = useState(Math.max(1, ids.length - startIndex));
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [slow, setSlow] = useState(false);
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const mounted = useRef(true);

  const sentence = sentenceById[ids[index]];
  const module = sentence ? moduleOfSentence(sentence.id) : null;
  const today = dateKey();
  const progress = ids.length ? ((index + 1) / ids.length) * 100 : 0;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopSpeaking();
    };
  }, []);

  const play = useCallback(async () => {
    if (!sentence || speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const rate = slow ? Math.max(0.55, data.settings.rate * 0.72) : data.settings.rate;
    setSpeaking(true);
    tapFeedback();
    await speakSentence(plainText(sentence.text), rate, {
      onDone: () => {
        if (mounted.current) setSpeaking(false);
      },
      onError: () => {
        if (mounted.current) setSpeaking(false);
      },
    });
  }, [data.settings.rate, sentence, slow, speaking]);

  useEffect(() => {
    if (!data.settings.autoPlay || !sentence || finished) return;
    const timer = setTimeout(() => {
      play();
    }, 420);
    return () => clearTimeout(timer);
    // Only auto-play when the sentence changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence?.id, finished]);

  const rate = (value: Rating) => {
    if (!sentence || busy) return;
    setBusy(true);
    stopSpeaking();
    setSpeaking(false);
    completeSentence(sentence.id, value);
    if (value > 0) successFeedback();
    else tapFeedback();

    if (index >= ids.length - 1) {
      setFinished(true);
      setBusy(false);
      successFeedback();
      return;
    }

    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex((prev) => prev + 1);
      fade.setValue(1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setBusy(false);
    });
  };

  const replay = () => {
    setFinished(false);
    setIndex(0);
    setSessionSize(ids.length);
    setBusy(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (!sentence || !module) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={{ padding: 24 }}>没有找到这句练习。</Text>
      </View>
    );
  }

  if (finished) {
    const streak = streakOf(data.days, today);
    const totalMinutes = Math.max(1, Math.round(sessionSize * 1.6));
    const mastered = Object.values(data.progress).filter((p) => p.mastery >= MASTERED_AT).length;
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.finishScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.finishMark}>
            <View style={styles.finishRing} />
            <Ionicons name="checkmark" size={34} color={colors.white} />
          </View>
          <Text style={styles.finishEyebrow}>
            {source === 'library' && ids.length === 1 ? 'SINGLE SENTENCE' : 'SESSION COMPLETE'}
          </Text>
          <Text style={styles.finishTitle}>
            {source === 'library' && ids.length === 1 ? '这一句，练完了。' : '今天的练习，完成了。'}
          </Text>
          <Text style={styles.finishLead}>
            {sessionSize} 句 · {totalMinutes} 分钟 · 连续 {streak} 天
          </Text>

          <View style={styles.finishStats}>
            <FinishStat value={String(sessionSize)} label="本次句子" />
            <View style={styles.finishLine} />
            <FinishStat value={String(streak)} label="连续天数" />
            <View style={styles.finishLine} />
            <FinishStat value={String(mastered)} label="累计掌握" />
          </View>

          <Card tone="alt" style={styles.finishNote}>
            <WaveMark color={colors.forestLight} height={22} bars={5} />
            <Text style={styles.finishNoteTitle}>下一步</Text>
            <Text style={styles.finishNoteBody}>
              {mastered >= 30
                ? '大部分句子已经稳了。明天试着把语速提高一点，再录一遍对比。'
                : '明天这些句子会按记忆曲线回来。今晚睡前，可以在脑子里再过一遍今天练到的位置。'}
            </Text>
          </Card>

          <View style={styles.finishActions}>
            <Pressable style={styles.primaryCta} onPress={onClose}>
              <Text style={styles.primaryCtaText}>
                {source === 'library' ? (ids.length === 1 ? '回到句库' : '回到章节') : '回到今天'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </Pressable>
            {ids.length > 1 ? (
              <Pressable style={styles.secondaryCta} onPress={replay}>
                <Text style={styles.secondaryCtaText}>再练一轮</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryCta} onPress={onPracticeAgain}>
                <Text style={styles.secondaryCtaText}>继续练别的</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.close} hitSlop={8} accessibilityLabel="关闭练习">
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.headerSub}>
            {index + 1} / {ids.length}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar value={progress} height={3} color={colors.accent} track={colors.line} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metaRow}>
            <Pill label={`第 ${module.index} 章 · ${module.title}`} tone="forest" />
            <Text style={styles.levelText}>
              {'●'.repeat(sentence.level)}
              {'○'.repeat(3 - sentence.level)}
            </Text>
          </View>

          <RichSentence text={sentence.text} style={styles.sentence} />
          <Text style={styles.ipa}>/{sentence.ipa}/</Text>

          <View style={styles.focusRow}>
            <View style={styles.focusDot} />
            <Text style={styles.focusText}>{sentence.focus}</Text>
          </View>

          <Card style={styles.listenCard}>
            <View style={styles.listenTop}>
              <Pressable
                onPress={play}
                style={[styles.playButton, speaking && styles.playButtonActive]}
                accessibilityLabel="播放标准朗读"
              >
                <Ionicons
                  name={speaking ? 'pause' : 'play'}
                  size={26}
                  color={colors.white}
                  style={{ marginLeft: speaking ? 0 : 3 }}
                />
              </Pressable>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.listenTitle}>
                  {speaking ? '正在朗读…' : '听标准朗读'}
                </Text>
                <Text style={styles.listenSub}>
                  {slow ? '慢速 · 先听清每个音' : '原速 · 注意词与词的连接'}
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
                  <Text style={[styles.speedText, slow && styles.speedTextActive]}>0.7×</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.listenWave}>
              {[8, 14, 22, 30, 24, 16, 10, 18, 26, 14, 8, 12, 20, 28, 18, 10].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: speaking ? h : Math.max(5, h * 0.45),
                      backgroundColor: speaking ? colors.accent : colors.lineStrong,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.listenHint}>
              听完再开口。模仿它的节奏，而不是只模仿单词。
            </Text>
          </Card>

          <Card style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="ear-outline" size={16} color={colors.accentDark} />
              <Text style={styles.tipLabel}>听感拆解</Text>
            </View>
            <Text style={styles.tipText}>{sentence.tip}</Text>
            <View style={styles.tipDivider} />
            <View style={styles.tipHeader}>
              <Ionicons name="fitness-outline" size={16} color={colors.forestLight} />
              <Text style={[styles.tipLabel, { color: colors.forestLight }]}>最小练习</Text>
            </View>
            <Text style={styles.drillText}>{sentence.drill}</Text>
          </Card>

          <RecorderPanel />

          <Text style={styles.rateLabel}>这一句，练得怎么样？</Text>
          <View style={styles.rateRow}>
            {ratings.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => rate(item.value)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`自评：${item.label}`}
                style={({ pressed }) => [
                  styles.rateButton,
                  item.value === 2 && styles.rateButtonGood,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={item.value === 2 ? colors.white : colors.ink}
                />
                <Text
                  style={[styles.rateTitle, item.value === 2 && { color: colors.white }]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[styles.rateHint, item.value === 2 && { color: '#DCE7DE' }]}
                >
                  {item.hint}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.rateNote}>评分只影响复习节奏，不用纠结。</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const FinishStat = ({ value, label }: { value: string; label: string }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={styles.finishStatValue}>{value}</Text>
    <Text style={styles.finishStatLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    paddingVertical: 8,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  headerSub: { fontSize: 10, color: colors.muted, marginTop: 2, letterSpacing: 0.5 },
  progressWrap: { paddingHorizontal: layout.gutter, marginTop: 4 },
  scroll: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.xl,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelText: { fontSize: 8, color: colors.lineStrong, letterSpacing: 2 },
  sentence: { marginTop: spacing.xl, fontSize: 29, lineHeight: 42, letterSpacing: -0.3 },
  ipa: {
    fontFamily: ipaFont,
    fontSize: 13,
    color: colors.muted,
    marginTop: 10,
    letterSpacing: 0.1,
  },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  focusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  focusText: { fontSize: 11, color: colors.muted, letterSpacing: 0.4 },
  listenCard: { marginTop: spacing.xxl, padding: spacing.lg },
  listenTop: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: { backgroundColor: colors.accent },
  listenTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  listenSub: { fontSize: 11, color: colors.muted, marginTop: 4 },
  speedToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgDeep,
    borderRadius: radius.pill,
    padding: 3,
  },
  speedItem: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill },
  speedItemActive: { backgroundColor: colors.surface },
  speedText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  speedTextActive: { color: colors.ink },
  listenWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    marginTop: spacing.lg,
  },
  waveBar: { width: 3, borderRadius: 2 },
  listenHint: { fontSize: 10, color: colors.faint, marginTop: 12 },
  tipCard: {
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderColor: '#F0D3C5',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.accentDark,
    textTransform: 'uppercase',
  },
  tipText: { fontSize: 14, lineHeight: 23, color: colors.ink, marginTop: 10 },
  tipDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#EAC5B4', marginVertical: 14 },
  drillText: { fontSize: 13, lineHeight: 21, color: colors.inkSoft, marginTop: 8 },
  rateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  rateRow: { flexDirection: 'row', gap: 8 },
  rateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 5,
  },
  rateButtonGood: { backgroundColor: colors.forest, borderColor: colors.forest },
  rateTitle: { fontSize: 12, fontWeight: '600', color: colors.ink },
  rateHint: { fontSize: 9, color: colors.muted },
  rateNote: { fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: 10 },
  finishScroll: {
    paddingHorizontal: layout.gutter,
    paddingTop: 60,
    paddingBottom: 50,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    alignItems: 'center',
  },
  finishMark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  finishEyebrow: {
    ...type.caption,
    color: colors.accent,
    marginTop: spacing.xxl,
  },
  finishTitle: {
    fontFamily: displayFont,
    fontSize: 34,
    lineHeight: 44,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.6,
  },
  finishLead: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 10,
    textAlign: 'center',
  },
  finishStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignSelf: 'stretch',
  },
  finishStatValue: { fontFamily: displayFont, fontSize: 27, color: colors.ink },
  finishStatLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
  finishLine: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: colors.line },
  finishNote: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
    padding: spacing.xl,
    backgroundColor: colors.forestSoft,
    borderColor: colors.forestSoft,
  },
  finishNoteTitle: { fontSize: 14, fontWeight: '600', color: colors.forest, marginTop: 12 },
  finishNoteBody: { fontSize: 12, lineHeight: 20, color: colors.forest, marginTop: 6 },
  finishActions: { marginTop: spacing.xxl, gap: 10, alignSelf: 'stretch' },
  primaryCta: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  secondaryCta: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: { color: colors.inkSoft, fontSize: 14, fontWeight: '500' },
});
