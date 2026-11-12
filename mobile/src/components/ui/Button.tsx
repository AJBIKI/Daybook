import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paletteByVariant: Record<
    ButtonVariant,
    { bg: string; border: string; text: string }
  > = {
    primary: {
      bg: colors.accent,
      border: colors.accent,
      text: colors.onAccent,
    },
    secondary: {
      bg: colors.surface,
      border: colors.line,
      text: colors.ink,
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      text: colors.accent,
    },
    danger: {
      bg: colors.danger,
      border: colors.danger,
      text: colors.onAccent,
    },
  };

  const token = paletteByVariant[variant];

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isInactive, busy: loading }}
        disabled={isInactive}
        onPress={onPress}
        onPressIn={() => {
          if (!reducedMotion && !isInactive) {
            scale.value = withTiming(0.97, { duration: 150 });
          }
        }}
        onPressOut={() => {
          if (!reducedMotion) {
            scale.value = withTiming(1, { duration: 150 });
          }
        }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: token.bg,
            borderColor: token.border,
            borderWidth: variant === 'secondary' ? 1 : 0,
            opacity: loading ? 0.85 : disabled ? 0.5 : pressed ? 0.88 : 1,
          },
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={token.text} />
        ) : (
          <Text variant="bodyStrong" color={token.text} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.control,
    borderRadius: radius.input,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
