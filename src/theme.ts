import { Platform, TextStyle } from 'react-native';

/**
 * Echo design tokens.
 * Warm paper, ink, one terracotta accent, deep forest for emphasis surfaces.
 */
export const colors = {
  bg: '#F4F0E7',
  bgDeep: '#EDE7DA',
  surface: '#FFFDF8',
  surfaceAlt: '#FAF6EE',
  ink: '#1B1A17',
  inkSoft: '#4B463E',
  muted: '#8C8477',
  faint: '#B4AC9E',
  line: '#E5DDCE',
  lineStrong: '#D6CBB8',
  accent: '#D2583A',
  accentDark: '#A83C22',
  accentSoft: '#F7E1D6',
  forest: '#1F342A',
  forestLight: '#2E4A3B',
  forestSoft: '#DEE8DF',
  gold: '#BC8A2C',
  goldSoft: '#F3E7C8',
  white: '#FFFFFF',
  danger: '#A53B28',
  overlay: 'rgba(27,26,23,0.45)',
} as const;

export const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Songti SC", serif',
});

/** IPA needs a font with reliable Unicode phonetic coverage. */
export const ipaFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
});

export const type = {
  display: {
    fontFamily: displayFont,
    fontSize: 38,
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -0.8,
  } as TextStyle,
  h1: {
    fontFamily: displayFont,
    fontSize: 30,
    lineHeight: 38,
    color: colors.ink,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontFamily: displayFont,
    fontSize: 23,
    lineHeight: 30,
    color: colors.ink,
    letterSpacing: -0.2,
  } as TextStyle,
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.ink,
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
  } as TextStyle,
  small: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  } as TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
  } as TextStyle,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  huge: 40,
};

export const layout = {
  gutter: 22,
  maxWidth: 520,
};
