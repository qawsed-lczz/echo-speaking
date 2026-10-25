import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '../theme';

type Mark = 'plain' | 'link' | 'stress';

interface Segment {
  text: string;
  mark: Mark;
}

/**
 * Splits annotated sentence text into styled runs.
 * `{...}` = linked chunk, `*...*` = stressed word.
 */
export const parseSentence = (raw: string): Segment[] => {
  const segments: Segment[] = [];
  let buffer = '';
  let mark: Mark = 'plain';

  const flush = () => {
    if (buffer) segments.push({ text: buffer, mark });
    buffer = '';
  };

  for (const char of raw) {
    if (char === '{') {
      flush();
      mark = 'link';
    } else if (char === '}') {
      flush();
      mark = 'plain';
    } else if (char === '*') {
      flush();
      mark = mark === 'stress' ? 'plain' : 'stress';
    } else {
      buffer += char;
    }
  }
  flush();
  return segments;
};

export const RichSentence = ({
  text,
  style,
  linkColor = colors.accent,
}: {
  text: string;
  style?: TextStyle | TextStyle[];
  linkColor?: string;
}) => (
  <Text style={[styles.base, style]}>
    {parseSentence(text).map((segment, index) => (
      <Text
        key={`${index}-${segment.text}`}
        style={
          segment.mark === 'link'
            ? [styles.link, { color: linkColor }]
            : segment.mark === 'stress'
            ? styles.stress
            : undefined
        }
      >
        {segment.text}
      </Text>
    ))}
  </Text>
);

const styles = StyleSheet.create({
  base: {
    fontSize: 27,
    lineHeight: 39,
    color: colors.ink,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  link: {
    fontWeight: '600',
  },
  stress: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: colors.gold,
  },
});
