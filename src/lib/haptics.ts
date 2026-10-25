import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = Platform.OS !== 'web';

export const setHapticsEnabled = (value: boolean) => {
  enabled = value && Platform.OS !== 'web';
};

export const tapFeedback = () => {
  if (enabled) Haptics.selectionAsync().catch(() => {});
};

export const successFeedback = () => {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export const impactFeedback = () => {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
