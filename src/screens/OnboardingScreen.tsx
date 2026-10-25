import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, EchoText, Pill } from '../components/ui';
import { modules } from '../data/curriculum';
import { goals, placementQuestions, recommendStart, selfAssessments } from '../data/placement';
import { planSize } from '../lib/plan';
import { colors, displayFont, ipaFont, layout, radius, spacing, type } from '../theme';
import { Level } from '../types';
import { useStore } from '../state/store';

type Minutes = 5 | 10 | 15;
const TOTAL_STEPS = 4;

export const OnboardingScreen = () => {
  const insets = useSafeAreaInsets();
  const { finishOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [selfKey, setSelfKey] = useState('talk');
  const [minutes, setMinutes] = useState<Minutes>(10);
  const [goal, setGoal] = useState('daily');
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [step, fade]);

  const selfLevel = (selfAssessments.find((item) => item.key === selfKey)?.level ?? 2) as Level;
  const score = placementQuestions.reduce(
    (sum, question) => sum + (answers[question.id] === question.answer ? 1 : 0),
    0
  );
  const startModule = skipped
    ? selfLevel === 1
      ? 1
      : selfLevel === 2
      ? 3
      : 5
    : recommendStart(score, selfLevel);
  const startMod = modules[startModule - 1];
  const level: Level = startModule <= 2 ? 1 : startModule <= 4 ? 2 : 3;
  const size = planSize(minutes);

  const go = (next: number) => setStep(next);

  const submitQuiz = () => {
    if (quizIndex < placementQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      go(3);
    }
  };

  const finish = () =>
    finishOnboarding({
      level,
      startModule,
      dailyMinutes: minutes,
      goal,
    });

  const footer = () => {
    if (step === 0) return <Button label="开始定位 · 约 1 分钟" onPress={() => go(1)} />;
    if (step === 1)
      return (
        <View>
          <Button label="继续" onPress={() => go(2)} />
          <Text style={styles.footerHint}>之后可以在设置里随时调整</Text>
        </View>
      );
    if (step === 2) {
      const answered = !!answers[placementQuestions[quizIndex].id];
      return (
        <View>
          <Button
            label={quizIndex === placementQuestions.length - 1 ? '生成我的计划' : '下一题'}
            onPress={submitQuiz}
            disabled={!answered}
          />
          <Pressable
            onPress={() => {
              setSkipped(true);
              go(3);
            }}
            style={styles.skipWrap}
          >
            <Text style={styles.skipText}>跳过测评，直接开始</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View>
        <Button label="进入今天" icon="arrow-forward" onPress={finish} />
        <Pressable onPress={() => go(1)} style={styles.skipWrap}>
          <Text style={styles.skipText}>重新选择</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <Pressable
            onPress={() => go(step - 1)}
            style={styles.backLink}
            hitSlop={10}
            accessibilityLabel="返回上一步"
          >
            <Ionicons name="arrow-back" size={15} color={colors.inkSoft} />
            <Text style={styles.backText}>返回</Text>
          </Pressable>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>ECHO</Text>
          </View>
        )}
        <View style={styles.stepDots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} style={[styles.stepDot, index <= step && styles.stepDotActive]} />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.body, { opacity: fade }]}>
        {step === 0 ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <EchoText style={styles.eyebrow}>SPEAK, DON'T MEMORIZE</EchoText>
              <Text style={styles.display}>
                让每个词，{'\n'}自然滑向<Text style={{ color: colors.accent }}>下一个</Text>。
              </Text>
              <EchoText variant="body" style={styles.heroBody}>
                为大学生和研究生设计的美式口语训练。连读、爆破、弱读、语调——每天几分钟，把规则练成肌肉记忆。
              </EchoText>
            </View>

            <Card tone="forest" style={styles.demoCard}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoLabel}>连读 · 辅音 + 元音</Text>
                <View style={styles.demoBars}>
                  {[10, 18, 26, 14, 8].map((h, i) => (
                    <View key={i} style={[styles.demoBar, { height: h }]} />
                  ))}
                </View>
              </View>
              <Text style={styles.demoSentence}>
                Not <Text style={{ color: '#F0A183' }}>at all</Text>.
              </Text>
              <Text style={styles.demoIpa}>nɑː.ɾəˈtɔːl</Text>
              <Text style={styles.demoHint}>
                t 在元音之间变成轻快闪音 —— 像“na-da-dall”。
              </Text>
            </Card>

            <View style={styles.statRow}>
              <Stat value="8" label="发音要点" />
              <View style={styles.statDivider} />
              <Stat value="48" label="经典例句" />
              <View style={styles.statDivider} />
              <Stat value="5–15" label="分钟 / 天" />
            </View>

            <View style={styles.privacyRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
              <Text style={styles.privacyText}>无需注册 · 练习记录只保存在本机</Text>
            </View>
          </ScrollView>
        ) : null}

        {step === 1 ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <EchoText style={styles.eyebrow}>01 · 认识你的起点</EchoText>
            <Text style={styles.title}>现在的你，{'\n'}口语在哪一步？</Text>
            <EchoText variant="body" style={styles.lead}>
              没有标准答案。选最接近的状态，计划会跟着你的表现继续调整。
            </EchoText>

            <View style={styles.selfList}>
              {selfAssessments.map((item) => {
                const active = item.key === selfKey;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setSelfKey(item.key)}
                    style={[styles.selfCard, active && styles.selfCardActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioCore} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selfTitle, active && styles.selfTitleActive]}>
                        {item.title}
                      </Text>
                      <Text style={styles.selfDesc}>{item.desc}</Text>
                    </View>
                    <Pill label={`L${item.level}`} tone={active ? 'accent' : 'neutral'} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.blockLabel}>每天留多少时间</Text>
            <View style={styles.minutesRow}>
              {([5, 10, 15] as Minutes[]).map((value) => {
                const active = value === minutes;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setMinutes(value)}
                    style={[styles.minuteCard, active && styles.minuteCardActive]}
                  >
                    <Text style={[styles.minuteValue, active && styles.minuteValueActive]}>
                      {value}
                    </Text>
                    <Text style={[styles.minuteUnit, active && styles.minuteUnitActive]}>
                      分钟 · {planSize(value)} 句
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.blockLabel}>最想先解决</Text>
            <View style={styles.chipWrap}>
              {goals.map((item) => {
                const active = item.key === goal;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setGoal(item.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {step === 2 ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.quizTop}>
              <EchoText style={styles.eyebrow}>02 · 5 道小问题</EchoText>
              <Text style={styles.quizCounter}>
                {quizIndex + 1} / {placementQuestions.length}
              </Text>
            </View>
            <Text style={styles.quizPrompt}>{placementQuestions[quizIndex].prompt}</Text>
            <EchoText variant="small" style={{ marginTop: 6 }}>
              凭感觉选，选错也没关系，只是用来定位
            </EchoText>

            <View style={styles.optionList}>
              {placementQuestions[quizIndex].options.map((option) => {
                const question = placementQuestions[quizIndex];
                const selected = answers[question.id] === option.key;
                const answered = !!answers[question.id];
                const isCorrect = option.key === question.answer;
                const showCorrect = answered && isCorrect;
                const showWrong = selected && !isCorrect;
                return (
                  <Pressable
                    key={option.key}
                    disabled={answered}
                    onPress={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: option.key }))
                    }
                    style={[
                      styles.option,
                      showCorrect && styles.optionCorrect,
                      showWrong && styles.optionWrong,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionKey,
                        showCorrect && styles.optionKeyCorrect,
                        showWrong && styles.optionKeyWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionKeyText,
                          (showCorrect || showWrong) && { color: colors.white },
                        ]}
                      >
                        {option.key}
                      </Text>
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {showCorrect ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.forestLight} />
                    ) : null}
                    {showWrong ? (
                      <Ionicons name="close-circle" size={20} color={colors.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {answers[placementQuestions[quizIndex].id] ? (
              <Card tone="alt" style={styles.explainCard}>
                <Text style={styles.explainLabel}>为什么</Text>
                <Text style={styles.explainText}>{placementQuestions[quizIndex].explain}</Text>
              </Card>
            ) : null}
          </ScrollView>
        ) : null}

        {step === 3 ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <EchoText style={styles.eyebrow}>03 · 你的起点</EchoText>
            <Text style={styles.title}>
              从「<Text style={{ color: colors.accent }}>{startMod.title}</Text>」{'\n'}开始就很好。
            </Text>
            <EchoText variant="body" style={styles.lead}>
              {skipped
                ? '没关系，计划会从基础连读开始，练几天就能找到手感。'
                : `根据 ${placementQuestions.length} 道题和你的自评，这个起点最省力。`}
            </EchoText>

            <Card style={styles.summaryCard}>
              <SummaryRow icon="flag-outline" label="每日目标" value={`${size} 句 · 约 ${Math.round(size * 1.6)} 分钟`} />
              <View style={styles.rowDivider} />
              <SummaryRow icon="layers-outline" label="推荐起点" value={`第 ${startMod.index} 章 · ${startMod.title}`} />
              <View style={styles.rowDivider} />
              <SummaryRow icon="speedometer-outline" label="当前阶段" value={`L${level} · ${level === 1 ? '起步' : level === 2 ? '进阶' : '自如'}`} />
              <View style={styles.rowDivider} />
              <SummaryRow
                icon="compass-outline"
                label="练习重点"
                value={goals.find((g) => g.key === goal)?.label ?? '日常交流'}
              />
            </Card>

            <View style={styles.promise}>
              <Ionicons name="refresh-outline" size={18} color={colors.forestLight} />
              <Text style={styles.promiseText}>
                练得顺的句子会隔几天再回来，卡住的句子会更早出现。计划每天自动重排。
              </Text>
            </View>

            <Text style={styles.tinyNote}>
              标准朗读使用设备自带的 en-US 语音，建议戴耳机练习。
            </Text>
          </ScrollView>
        ) : null}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer()}</View>
    </View>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SummaryRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.summaryRow}>
    <Ionicons name={icon} size={18} color={colors.muted} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  brand: { fontSize: 13, letterSpacing: 3, fontWeight: '700', color: colors.ink },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: { fontSize: 12, color: colors.inkSoft },
  stepDots: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 16, height: 3, borderRadius: 2, backgroundColor: colors.lineStrong },
  stepDotActive: { backgroundColor: colors.ink, width: 22 },
  body: { flex: 1 },
  scroll: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: 150,
  },
  hero: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accentSoft,
    opacity: 0.55,
    top: -70,
    right: -80,
  },
  eyebrow: {
    ...type.caption,
    color: colors.accent,
    letterSpacing: 1.6,
    marginBottom: spacing.md,
  },
  display: {
    fontFamily: displayFont,
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: -1,
    color: colors.ink,
  },
  heroBody: {
    marginTop: spacing.lg,
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkSoft,
    maxWidth: 340,
  },
  demoCard: { padding: spacing.xl, borderRadius: radius.xl },
  demoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoLabel: { fontSize: 11, letterSpacing: 1.2, color: '#A9BDB0', textTransform: 'uppercase' },
  demoBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 26 },
  demoBar: { width: 3, borderRadius: 2, backgroundColor: '#6E8B79' },
  demoSentence: {
    fontFamily: displayFont,
    fontSize: 34,
    color: colors.white,
    marginTop: 22,
    letterSpacing: -0.5,
  },
  demoIpa: {
    fontFamily: ipaFont,
    fontSize: 12,
    color: '#A9BDB0',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  demoHint: { fontSize: 12, color: '#C8D6CC', marginTop: 18, lineHeight: 18 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  statValue: { fontFamily: displayFont, fontSize: 26, color: colors.ink },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.line },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  privacyText: { fontSize: 10, color: colors.faint, letterSpacing: 0.2 },
  title: {
    fontFamily: displayFont,
    fontSize: 33,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: 4,
  },
  lead: { marginTop: spacing.md, fontSize: 14, lineHeight: 22, maxWidth: 360 },
  selfList: { marginTop: spacing.xxl, gap: 10 },
  selfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  selfCardActive: { borderColor: colors.ink, backgroundColor: colors.white },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  selfTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  selfTitleActive: { color: colors.ink },
  selfDesc: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  blockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.6,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  minutesRow: { flexDirection: 'row', gap: 10 },
  minuteCard: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'flex-start',
  },
  minuteCardActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  minuteValue: { fontFamily: displayFont, fontSize: 26, color: colors.ink },
  minuteValueActive: { color: colors.white },
  minuteUnit: { fontSize: 11, color: colors.muted, marginTop: 4 },
  minuteUnitActive: { color: '#B9C9BE' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.inkSoft },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  quizTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizCounter: { fontSize: 12, color: colors.muted, letterSpacing: 1 },
  quizPrompt: {
    fontFamily: displayFont,
    fontSize: 25,
    lineHeight: 35,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  optionList: { marginTop: spacing.xxl, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  optionCorrect: { borderColor: colors.forestLight, backgroundColor: colors.forestSoft },
  optionWrong: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionKey: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionKeyCorrect: { backgroundColor: colors.forestLight },
  optionKeyWrong: { backgroundColor: colors.accent },
  optionKeyText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  optionLabel: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  explainCard: { marginTop: spacing.lg, padding: spacing.lg },
  explainLabel: { fontSize: 10, letterSpacing: 1.4, color: colors.muted, marginBottom: 6 },
  explainText: { fontSize: 13, lineHeight: 21, color: colors.inkSoft },
  summaryCard: { marginTop: spacing.xxl, paddingVertical: 6, paddingHorizontal: spacing.lg },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 15,
  },
  summaryLabel: { fontSize: 13, color: colors.muted, flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  promise: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.forestSoft,
  },
  promiseText: { flex: 1, fontSize: 12, lineHeight: 19, color: colors.forest },
  tinyNote: { fontSize: 11, color: colors.faint, marginTop: spacing.xl, lineHeight: 17 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  footerHint: { fontSize: 11, color: colors.faint, textAlign: 'center', marginTop: 10 },
  skipWrap: { alignItems: 'center', paddingTop: 12 },
  skipText: { fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },
});
