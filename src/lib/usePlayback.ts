import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioCatalog } from './audioCatalog';
import { speakSentence, stopSpeaking } from './speech';

interface Playback {
  playing: boolean;
  play: () => void;
  stop: () => void;
}

/**
 * Plays the remote conversation recording when available; falls back to the
 * device en-US voice if the catalog or network is unavailable.
 */
export const usePlayback = ({
  id,
  text,
  rate,
  slow,
  autoPlay = false,
}: {
  id: string;
  text: string;
  rate: number;
  slow: boolean;
  autoPlay?: boolean;
}): Playback => {
  const { urlFor } = useAudioCatalog();
  const url = urlFor(id);
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const playRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!url) return;
    try {
      player.playbackRate = slow ? 0.7 : 1;
    } catch {
      // Some platforms only allow changing rate while playing.
    }
  }, [player, slow, url]);

  const play = useCallback(() => {
    if (url) {
      if (status.playing) {
        player.pause();
        return;
      }
      if (status.didJustFinish) player.seekTo(0);
      player.play();
      return;
    }

    if (ttsSpeaking) {
      stopSpeaking();
      setTtsSpeaking(false);
      return;
    }

    const spokenRate = slow ? Math.max(0.55, rate * 0.72) : rate;
    setTtsSpeaking(true);
    speakSentence(text, spokenRate, {
      onDone: () => setTtsSpeaking(false),
      onError: () => setTtsSpeaking(false),
    });
  }, [player, rate, slow, status.didJustFinish, status.playing, text, ttsSpeaking, url]);

  playRef.current = play;

  const stop = useCallback(() => {
    stopSpeaking();
    setTtsSpeaking(false);
    try {
      player.pause();
    } catch {
      // Player may already be released.
    }
  }, [player]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => playRef.current(), 450);
    return () => clearTimeout(timer);
  }, [autoPlay, id, url]);

  useEffect(
    () => () => {
      stopSpeaking();
    },
    []
  );

  return {
    playing: url ? status.playing : ttsSpeaking,
    play,
    stop,
  };
};
