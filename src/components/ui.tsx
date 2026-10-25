import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, layout, radius, spacing, type } from '../theme';

type TextVariant = keyof typeof type;

export const EchoText = ({
  variant = 'body',
  style,
  children,
  ...rest
}: TextProps & { variant?: TextVariant; children?: ReactNode }) => (
  <Text {...rest} style={[type[variant], style]}>
    {children}
  </Text>
);

export const Screen = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.screen, style]}>
    <View style={styles.shell}>{children}</View>
  </View>
);

export const Card = ({
  children,
  style,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'forest' | 'alt' | 'accent';
}) => <View style={[styles.card, toneStyles[tone], style]}>{children}</View>;

const toneStyles = StyleSheet.create({
  surface: { backgroundColor: colors.surface, borderColor: colors.line },
  alt: { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
  forest: { backgroundColor: colors.forest, borderColor: colors.forest },
  accent: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
});

export const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  return { scale, onPressIn, onPressOut };
};

export const PressableScale = ({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[{ transform: [{ scale }] }, disabled && styles.disabled, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'dark' | 'outline' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const config = {
    primary: { bg: colors.accent, fg: colors.white, border: colors.accent },
    dark: { bg: colors.forest, fg: colors.white, border: colors.forest },
    outline: { bg: 'transparent', fg: colors.ink, border: colors.lineStrong },
    ghost: { bg: colors.surfaceAlt, fg: colors.inkSoft, border: 'transparent' },
  }[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[
        styles.button,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={config.fg} style={{ marginRight: 8 }} /> : null}
      <Text style={[styles.buttonLabel, { color: config.fg }]}>{label}</Text>
    </PressableScale>
  );
};

export const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
    accessibilityRole="button"
  >
    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
  </Pressable>
);

export const ProgressBar = ({
  value,
  color = colors.accent,
  track = colors.line,
  height = 6,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) => (
  <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
    <View
      style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        height: '100%',
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

export const SectionTitle = ({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) => (
  <View style={styles.sectionTitle}>
    <EchoText variant="h3">{title}</EchoText>
    {action ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

export const Pill = ({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'forest' | 'gold' }) => {
  const tones = {
    neutral: { bg: colors.bgDeep, fg: colors.muted },
    accent: { bg: colors.accentSoft, fg: colors.accentDark },
    forest: { bg: colors.forestSoft, fg: colors.forestLight },
    gold: { bg: colors.goldSoft, fg: colors.gold },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: tones.bg }]}>
      <Text style={[styles.pillText, { color: tones.fg }]}>{label}</Text>
    </View>
  );
};

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />
);

export const WaveMark = ({
  color = colors.accent,
  height = 26,
  bars = 5,
}: {
  color?: string;
  height?: number;
  bars?: number;
}) => {
  const heights = [0.45, 0.75, 1, 0.65, 0.4];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: height * (heights[i % heights.length] ?? 0.6),
            borderRadius: 2,
            marginRight: i === bars - 1 ? 0 : 3,
            backgroundColor: color,
            opacity: 0.85 - i * 0.08,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
  },
  button: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.white,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionAction: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
