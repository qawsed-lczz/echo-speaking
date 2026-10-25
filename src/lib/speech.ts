import * as Speech from 'expo-speech';

export interface SpeechHandlers {
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
}

/** Speak a sentence with an American English system voice. */
export const speakSentence = async (
  text: string,
  rate: number,
  handlers: SpeechHandlers = {}
): Promise<void> => {
  try {
    await Speech.stop();
  } catch {
    // Speech may not be ready yet on first launch.
  }
  Speech.speak(text, {
    language: 'en-US',
    rate,
    pitch: 1,
    onStart: handlers.onStart,
    onDone: handlers.onDone,
    onStopped: handlers.onDone,
    onError: handlers.onError,
  });
};

export const stopSpeaking = (): void => {
  Speech.stop().catch(() => {});
};

export const isSpeaking = async (): Promise<boolean> => {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
};
