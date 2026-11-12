import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export function triggerLightHaptic(): void {
  try {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  } catch {
    // Devices without haptic motors or test environments can ignore safely.
  }
}
