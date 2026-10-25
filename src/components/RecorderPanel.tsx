import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { impactFeedback } from '../lib/haptics';
import { stopSpeaking } from '../lib/speech';

const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const RecorderPanel = () => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const player = useAudioPlayer(uri);
  const playerStatus = useAudioPlayerStatus(player);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      try {
        recorder.stop().catch(() => {});
      } catch {
        // Recorder was already released.
      }
    };
  }, [recorder]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    stopSpeaking();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('需要麦克风权限才能录音。可以在系统设置里允许 Echo 使用麦克风。');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      impactFeedback();
    } catch {
      setError('这台设备暂时无法录音，可以先只做跟读。');
    } finally {
      if (mounted.current) setStarting(false);
    }
  };

  const stop = async () => {
    try {
      await recorder.stop();
      const nextUri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (nextUri) {
        setUri(nextUri);
        impactFeedback();
      }
    } catch {
      setError('录音保存失败，再试一次。');
    }
  };

  const playMine = () => {
    if (!uri) return;
    if (playerStatus.playing) {
      player.pause();
      return;
    }
    if ((playerStatus.currentTime ?? 0) >= (playerStatus.duration ?? 0) - 0.05) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mic-outline" size={16} color={colors.inkSoft} />
          <Text style={styles.headerTitle}>跟读录音</Text>
        </View>
        <Text style={styles.headerHint}>听一遍原声，再录自己</Text>
      </View>

      {recorderState.isRecording ? (
        <View style={styles.recordingRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTime}>{formatTime(recorderState.durationMillis)}</Text>
          <Text style={styles.recordingHint}>正在录音…</Text>
          <Pressable onPress={stop} style={styles.stopButton}>
            <View style={styles.stopSquare} />
            <Text style={styles.stopText}>停止</Text>
          </Pressable>
        </View>
      ) : uri ? (
        <View style={styles.playbackRow}>
          <Pressable onPress={playMine} style={styles.smallPlay}>
            <Ionicons
              name={playerStatus.playing ? 'pause' : 'play'}
              size={18}
              color={colors.white}
              style={{ marginLeft: playerStatus.playing ? 0 : 2 }}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={styles.miniWave}>
              {[8, 14, 20, 12, 24, 16, 10, 22, 14, 8, 18, 26, 12, 16, 9].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniBar,
                    {
                      height: h,
                      backgroundColor: playerStatus.playing ? colors.accent : colors.lineStrong,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.playbackLabel}>
              {playerStatus.playing ? '正在播放我的录音' : `我的录音 · ${formatTime(playerStatus.duration * 1000 || 0)}`}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              player.pause();
              setUri(null);
            }}
            style={styles.retake}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.muted} />
            <Text style={styles.retakeText}>重录</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={start} style={styles.idleRow} disabled={starting}>
          <View style={styles.micButton}>
            <Ionicons name="mic" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.idleTitle}>{starting ? '正在准备麦克风…' : '点一下，开始跟读'}</Text>
            <Text style={styles.idleHint}>安静环境 · 离手机约 20cm · 整句读完</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.faint} />
        </Pressable>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.privacy}>录音只保存在本机，不会上传。</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 12, fontWeight: '600', color: colors.ink, letterSpacing: 0.4 },
  headerHint: { fontSize: 9, color: colors.faint },
  idleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleTitle: { fontSize: 13, fontWeight: '500', color: colors.ink },
  idleHint: { fontSize: 9, color: colors.faint, marginTop: 3 },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  recordingTime: { fontFamily: 'monospace', fontSize: 17, color: colors.ink },
  recordingHint: { flex: 1, fontSize: 11, color: colors.muted },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  stopSquare: { width: 9, height: 9, borderRadius: 2, backgroundColor: colors.white },
  stopText: { fontSize: 11, color: colors.white, fontWeight: '600' },
  playbackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  smallPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniWave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 26 },
  miniBar: { width: 2.5, borderRadius: 2 },
  playbackLabel: { fontSize: 9, color: colors.muted, marginTop: 4 },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 6 },
  retakeText: { fontSize: 10, color: colors.muted },
  error: { fontSize: 10, color: colors.danger, lineHeight: 16, marginTop: 10 },
  privacy: { fontSize: 9, color: colors.faint, marginTop: 12 },
});
