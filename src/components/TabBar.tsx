import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius, spacing } from '../theme';

export type TabKey = 'home' | 'library' | 'progress';

const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: '今天', icon: 'sunny-outline', active: 'sunny' },
  { key: 'library', label: '句库', icon: 'albums-outline', active: 'albums' },
  { key: 'progress', label: '进度', icon: 'stats-chart-outline', active: 'stats-chart' },
];

export const TabBar = ({
  active,
  onChange,
  bottomInset,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  bottomInset: number;
}) => (
  <View style={[styles.wrap, { paddingBottom: Math.max(bottomInset, 10) }]}>
    <View style={styles.inner}>
      {tabs.map((tab) => {
        const focused = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Ionicons
              name={focused ? tab.active : tab.icon}
              size={21}
              color={focused ? colors.ink : colors.faint}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
            <View style={[styles.dot, focused && styles.dotActive]} />
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: spacing.xl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    color: colors.faint,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
});
