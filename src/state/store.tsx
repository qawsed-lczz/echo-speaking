import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppData, Profile, Rating, Settings } from '../types';
import { dateKey } from '../lib/dates';
import { buildPlan, ensurePlan, nextProgress, withCompletion } from '../lib/plan';

const STORAGE_KEY = '@echo-speaking/data/v1';

const defaultSettings: Settings = {
  rate: 0.92,
  autoPlay: true,
  haptics: true,
};

const defaultProfile: Profile = {
  onboarded: false,
  level: 1,
  startModule: 1,
  dailyMinutes: 10,
  goal: 'daily',
  createdAt: new Date().toISOString(),
};

export const createInitialData = (): AppData => ({
  version: 1,
  profile: defaultProfile,
  progress: {},
  days: {},
  plan: null,
  settings: defaultSettings,
});

interface StoreValue {
  data: AppData;
  ready: boolean;
  completeSentence: (id: string, rating: Rating) => void;
  finishOnboarding: (profile: Omit<Profile, 'onboarded' | 'createdAt'>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setDailyMinutes: (minutes: 5 | 10 | 15) => void;
  regeneratePlan: () => void;
  refreshPlan: () => void;
  resetAll: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AppData>(createInitialData);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as AppData;
          if (parsed.version === 1 && parsed.profile) {
            setData({
              ...createInitialData(),
              ...parsed,
              settings: { ...defaultSettings, ...parsed.settings },
            });
          }
        }
      } catch {
        // A corrupt payload should not lock the learner out.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready]);

  const completeSentence = useCallback((id: string, rating: Rating) => {
    setData((prev) => {
      const today = dateKey();
      const progress = {
        ...prev.progress,
        [id]: nextProgress(prev.progress[id], rating, today),
      };
      const days = withCompletion(prev.days, id, today);
      const plan = prev.plan && prev.plan.date === today ? prev.plan : ensurePlan(prev, today);
      return { ...prev, progress, days, plan };
    });
  }, []);

  const finishOnboarding = useCallback(
    (profile: Omit<Profile, 'onboarded' | 'createdAt'>) => {
      setData((prev) => {
        const nextProfile: Profile = {
          ...profile,
          onboarded: true,
          createdAt: new Date().toISOString(),
        };
        const next = { ...prev, profile: nextProfile, plan: null };
        return { ...next, plan: buildPlan(next, dateKey()) };
      });
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setDailyMinutes = useCallback((minutes: 5 | 10 | 15) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, dailyMinutes: minutes } }));
  }, []);

  const regeneratePlan = useCallback(() => {
    setData((prev) => ({ ...prev, plan: buildPlan(prev, dateKey()) }));
  }, []);

  const refreshPlan = useCallback(() => {
    setData((prev) => {
      if (!prev.profile.onboarded) return prev;
      const today = dateKey();
      if (prev.plan?.date === today) return prev;
      return { ...prev, plan: buildPlan(prev, today) };
    });
  }, []);

  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setData(createInitialData());
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      ready,
      completeSentence,
      finishOnboarding,
      updateSettings,
      setDailyMinutes,
      regeneratePlan,
      refreshPlan,
      resetAll,
    }),
    [
      data,
      ready,
      completeSentence,
      finishOnboarding,
      updateSettings,
      setDailyMinutes,
      regeneratePlan,
      refreshPlan,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreValue => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
};
