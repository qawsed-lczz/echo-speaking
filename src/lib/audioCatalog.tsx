import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AudioCatalog } from '../types';

const MANIFEST_URL =
  'https://raw.githubusercontent.com/qawsed-lczz/echo-speaking/main/audio/manifest.json';
const CACHE_KEY = '@echo/audio-catalog/v1';

interface AudioCatalogValue {
  catalog: AudioCatalog | null;
  ready: boolean;
  urlFor: (id: string) => string | null;
}

const AudioCatalogContext = createContext<AudioCatalogValue>({
  catalog: null,
  ready: false,
  urlFor: () => null,
});

export const AudioCatalogProvider = ({ children }: { children: ReactNode }) => {
  const [catalog, setCatalog] = useState<AudioCatalog | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && !cancelled) {
          const parsed = JSON.parse(cached) as AudioCatalog;
          if (parsed?.files) setCatalog(parsed);
        }
      } catch {
        // Ignore a corrupt cache.
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(MANIFEST_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as AudioCatalog;
        if (!data?.files || !data.baseUrl) throw new Error('Invalid audio catalog');
        if (!cancelled) {
          setCatalog(data);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
        }
      } catch {
        // Offline or GitHub blocked: device TTS remains available.
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AudioCatalogValue>(
    () => ({
      catalog,
      ready,
      urlFor: (id: string) => {
        const file = catalog?.files?.[id];
        return file ? `${catalog!.baseUrl}${file}` : null;
      },
    }),
    [catalog, ready]
  );

  return (
    <AudioCatalogContext.Provider value={value}>{children}</AudioCatalogContext.Provider>
  );
};

export const useAudioCatalog = (): AudioCatalogValue => useContext(AudioCatalogContext);
