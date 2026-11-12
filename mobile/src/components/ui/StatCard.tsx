import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface StatCardProps {
  label: string;
  value: number;
  tone?: 'neutral' | 'danger' | 'accent';
  onPress?: () => void;
}

export function StatCard({
  label,
  value,
  tone = 'neutral',
  onPress,
}: StatCardProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotColor =
    tone === 'danger'
      ? colors.danger
      : tone === 'accent'
        ? colors.accent
        : colors.inkMuted;

  return (
    <Animated.View style={[styles.flex, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => {
          if (!reducedMotion && onPress) {
            scale.value = withTiming(0.97, { duration: 150 });
          }
        }}
        onPressOut={() => {
          if (!reducedMotion) {
            scale.value = withTiming(1, { duration: 150 });
          }
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
            opacity: pressed ? 0.88 : 1,
          },
        ]}>
        <View style={styles.header}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text variant="label" muted numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text variant="title">{value}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
});
