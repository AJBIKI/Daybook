import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../theme/tokens';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  disabled = false,
  onPress,
  style,
}: ChipProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (!reducedMotion && !disabled) {
            scale.value = withTiming(0.97, { duration: 150 });
          }
        }}
        onPressOut={() => {
          if (!reducedMotion) {
            scale.value = withTiming(1, { duration: 150 });
          }
        }}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: selected ? colors.accentSoft : colors.surface,
            borderColor: selected ? colors.accent : colors.line,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
          style,
        ]}>
        <Text
          variant="caption"
          color={selected ? colors.accent : colors.ink}
          style={styles.text}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget.min,
    borderRadius: radius.chip,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Inter-Medium',
  },
});
