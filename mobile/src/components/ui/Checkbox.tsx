import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { touchTarget } from '../../theme/tokens';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

export function Checkbox({
  checked,
  onToggle,
  disabled = false,
  accessibilityLabel,
}: CheckboxProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    scale.value = withSpring(checked ? 1.08 : 1, {
      damping: 12,
      stiffness: 220,
    });
    const t = setTimeout(() => {
      scale.value = withTiming(1, { duration: 150 });
    }, 120);
    return () => {
      clearTimeout(t);
    };
  }, [checked, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        ReactNativeHapticFeedback.trigger('impactLight', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
        onToggle();
      }}
      style={styles.hitArea}>
      <Animated.View
        style={[
          styles.box,
          animatedStyle,
          checked ? styles.checked : styles.unchecked,
          disabled ? styles.disabled : null,
          {
            backgroundColor: checked ? colors.accent : undefined,
            borderColor: checked ? colors.accent : colors.inkMuted,
          },
        ]}>
        {checked ? <Check size={14} color={colors.onAccent} strokeWidth={2.5} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {},
  unchecked: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
});
