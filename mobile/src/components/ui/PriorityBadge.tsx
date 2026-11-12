import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import type { TaskPriority } from '../../types/task';
import { Text } from './Text';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  1: 'Low',
  2: 'Med',
  3: 'High',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { colors } = useTheme();

  const dotColor =
    priority === 3
      ? colors.priorityHigh
      : priority === 2
        ? colors.priorityMed
        : colors.priorityLow;

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: colors.line,
          backgroundColor: colors.bg,
        },
      ]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text variant="caption" muted numberOfLines={1}>
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
});
