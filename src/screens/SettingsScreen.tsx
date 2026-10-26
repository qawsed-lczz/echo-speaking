import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SectionTitle } from '../components/ui';
import { planSize } from '../lib/plan';
import { speakSentence, stopSpeaking } from '../lib/speech';
import { colors, displayFont, layout, radius, spacing } from '../theme';
import { useStore } from '../state/store';

const rates = [
  { label: '慢速', value: 0.75 },
  { label: '标准', value: 0.92 },
  { label: '稍快', value: 1.05 },
];

export const SettingsScreen = ({ onBack }: { onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  const { data, updateSettings, regeneratePlan, resetAll, setDailyMinutes } = useStore();
  const { settings, profile } = data;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  const confirmReset = () => {
    setConfirming(false);
    resetAll();
  };

  const chooseMinutes = (value: 5 | 10 | 15) => {
    setDailyMinutes(value);
    regeneratePlan();
  };

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
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>练得舒服，{'\n'}才练得久。</Text>
        <Text style={styles.lead}>所有设置都可以随时改，进度不会丢。</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle title="每日目标" />
        <Card style={styles.card}>
          <View style={styles.minuteRow}>
            {([5, 10, 15] as const).map((value) => {
              const active = profile.dailyMinutes === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => chooseMinutes(value)}
                  style={[styles.minute, active && styles.minuteActive]}
                >
                  <Text style={[styles.minuteValue, active && styles.minuteValueActive]}>
                    {value}
                  </Text>
                  <Text style={[styles.minuteLabel, active && styles.minuteLabelActive]}>
                    分钟
                  </Text>
                  <Text style={[styles.minuteCount, active && styles.minuteCountActive]}>
                    {planSize(value)} 句
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.cardHint}>改动会重新生成今天的计划，已完成的句子会保留。</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="朗读速度" />
        <Card style={styles.card}>
          <View style={styles.rateRow}>
            {rates.map((item) => {
              const active = Math.abs(settings.rate - item.value) < 0.01;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => updateSettings({ rate: item.value })}
                  style={[styles.rateChip, active && styles.rateChipActive]}
                >
                  <Text style={[styles.rateText, active && styles.rateTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              style={styles.preview}
              onPress={() => speakSentence('Take it easy, not at all.', settings.rate)}
            >
              <Ionicons name="volume-medium-outline" size={16} color={colors.accentDark} />
              <Text style={styles.previewText}>试听</Text>
            </Pressable>
          </View>
          <Text style={styles.cardHint}>
            建议先用「慢速」听清连接位置，再用「标准」跟读。
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="练习偏好" />
        <Card style={styles.card}>
          <SettingSwitch
            title="自动播放"
            desc="进入句子时自动读一遍标准音"
            value={settings.autoPlay}
            onChange={(value) => updateSettings({ autoPlay: value })}
          />
          <View style={styles.rowDivider} />
          <SettingSwitch
            title="触感反馈"
            desc="点击和完成时轻微震动"
            value={settings.haptics}
            onChange={(value) => updateSettings({ haptics: value })}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="关于" />
        <Card style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>版本</Text>
            <Text style={styles.aboutValue}>1.1.0</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>课程</Text>
            <Text style={styles.aboutValue}>8 个要点 · 120 句 · 12 篇</Text>
          </View>
          <View style={styles.rowDivider} />
          <Text style={styles.aboutNote}>
            例句与短文使用云端口语语音，首次播放需要联网；练习记录只保存在本机，不需要注册账号。
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionTitle title="数据" />
        <Pressable onPress={() => setConfirming(true)} style={styles.reset}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <Text style={styles.resetText}>重置所有进度</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Echo · made for learners who want to sound natural.</Text>

      <Modal
        visible={confirming}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirming(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>重置所有进度？</Text>
            <Text style={styles.modalBody}>
              句子掌握度、连续天数和练习记录都会被清空，无法恢复。
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirming(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={confirmReset}>
                <Text style={styles.modalConfirmText}>确认重置</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const SettingSwitch = ({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <View style={styles.switchRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.switchTitle}>{title}</Text>
      <Text style={styles.switchDesc}>{desc}</Text>
    </View>
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  </View>
);

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
  headerTitle: { fontSize: 12, color: colors.muted, letterSpacing: 1.4 },
  intro: { marginTop: spacing.xxl },
  title: {
    fontFamily: displayFont,
    fontSize: 32,
    lineHeight: 42,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  lead: { fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 8 },
  section: { marginTop: spacing.xxl },
  card: { padding: spacing.lg },
  minuteRow: { flexDirection: 'row', gap: 8 },
  minute: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
  },
  minuteActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  minuteValue: { fontFamily: displayFont, fontSize: 22, color: colors.ink },
  minuteValueActive: { color: colors.white },
  minuteLabel: { fontSize: 9, color: colors.muted, marginTop: 1 },
  minuteLabelActive: { color: '#B9C9BE' },
  minuteCount: { fontSize: 9, color: colors.faint, marginTop: 4 },
  minuteCountActive: { color: '#9DB3A4' },
  cardHint: { fontSize: 10, color: colors.faint, marginTop: 12, lineHeight: 16 },
  rateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rateChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
  },
  rateChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  rateText: { fontSize: 12, color: colors.inkSoft },
  rateTextActive: { color: colors.white, fontWeight: '600' },
  preview: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  previewText: { fontSize: 11, color: colors.accentDark, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  switchTitle: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  switchDesc: { fontSize: 10, color: colors.muted, marginTop: 3 },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lineStrong,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: colors.forest },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleThumbOn: { marginLeft: 18 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 14 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { fontSize: 12, color: colors.muted },
  aboutValue: { fontSize: 12, color: colors.ink, fontWeight: '500' },
  aboutNote: { fontSize: 10, lineHeight: 17, color: colors.faint },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E3C4B9',
    backgroundColor: '#F9EDE7',
  },
  resetText: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  footer: { fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: spacing.xxl },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitle: { fontFamily: displayFont, fontSize: 23, color: colors.ink },
  modalBody: { fontSize: 13, lineHeight: 21, color: colors.inkSoft, marginTop: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 13, color: colors.inkSoft, fontWeight: '500' },
  modalConfirm: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 13, color: colors.white, fontWeight: '600' },
});
