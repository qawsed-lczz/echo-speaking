import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar, TabKey } from './src/components/TabBar';
import { WaveMark } from './src/components/ui';
import { StoreProvider, useStore } from './src/state/store';
import { colors, displayFont } from './src/theme';
import { setHapticsEnabled } from './src/lib/haptics';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { ModuleScreen } from './src/screens/ModuleScreen';
import { LessonScreen } from './src/screens/LessonScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Route =
  | { name: 'lesson'; ids: string[]; title: string; source: 'plan' | 'library'; startIndex?: number }
  | { name: 'module'; moduleId: string }
  | { name: 'settings' };

const Splash = () => (
  <View style={styles.splash}>
    <WaveMark color={colors.accent} height={34} bars={5} />
    <Text style={styles.splashTitle}>Echo</Text>
    <Text style={styles.splashSub}>把美式口语，练成肌肉记忆</Text>
  </View>
);

const Shell = () => {
  const insets = useSafeAreaInsets();
  const { ready, data, refreshPlan } = useStore();
  const [tab, setTab] = useState<TabKey>('home');
  const [stack, setStack] = useState<Route[]>([]);

  const push = useCallback((route: Route) => setStack((prev) => [...prev, route]), []);
  const pop = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);

  useEffect(() => {
    if (!ready) return;
    refreshPlan();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPlan();
    });
    return () => subscription.remove();
  }, [ready, refreshPlan]);

  useEffect(() => {
    setHapticsEnabled(data.settings.haptics);
  }, [data.settings.haptics]);

  useEffect(() => {
    if (!stack.length || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      pop();
      return true;
    });
    return () => subscription.remove();
  }, [stack.length, pop]);

  if (!ready) return <Splash />;

  if (!data.profile.onboarded) {
    return <OnboardingScreen />;
  }

  const top = stack[stack.length - 1];

  if (top?.name === 'lesson') {
    return (
      <LessonScreen
        ids={top.ids}
        title={top.title}
        source={top.source}
        startIndex={top.startIndex}
        onClose={pop}
        onPracticeAgain={pop}
      />
    );
  }

  if (top?.name === 'module') {
    return (
      <ModuleScreen
        moduleId={top.moduleId}
        onBack={pop}
        onPracticeSentence={(id) =>
          push({ name: 'lesson', ids: [id], title: '单句精练', source: 'library' })
        }
        onPracticeAll={(ids, title) =>
          push({ name: 'lesson', ids, title, source: 'library' })
        }
      />
    );
  }

  if (top?.name === 'settings') {
    return <SettingsScreen onBack={pop} />;
  }

  return (
    <View style={styles.root}>
      {tab === 'home' ? (
        <HomeScreen
          onPractice={(ids, title, source = 'plan', startIndex) =>
            push({ name: 'lesson', ids, title, source, startIndex })
          }
          onOpenModule={(moduleId) => push({ name: 'module', moduleId })}
          onOpenSettings={() => push({ name: 'settings' })}
          onOpenLibrary={() => setTab('library')}
          onOpenProgress={() => setTab('progress')}
        />
      ) : null}
      {tab === 'library' ? (
        <LibraryScreen onOpenModule={(moduleId) => push({ name: 'module', moduleId })} />
      ) : null}
      {tab === 'progress' ? (
        <ProgressScreen
          onOpenModule={(moduleId) => push({ name: 'module', moduleId })}
          onOpenSettings={() => push({ name: 'settings' })}
        />
      ) : null}
      <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  splashTitle: {
    fontFamily: displayFont,
    fontSize: 42,
    color: colors.ink,
    letterSpacing: 1,
  },
  splashSub: {
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 1,
  },
});
