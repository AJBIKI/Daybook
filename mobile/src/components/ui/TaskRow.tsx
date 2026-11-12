import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatDueLabel, isTaskOverdue } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../theme/tokens';
import type { Task } from '../../types/task';
import { Checkbox } from './Checkbox';
import { PriorityBadge } from './PriorityBadge';
import { Text } from './Text';

export interface TaskRowProps {
  task: Task;
  onToggle: (task: Task) => void;
  onPress: (task: Task) => void;
  disabled?: boolean;
}

function TaskRowInner({
  task,
  onToggle,
  onPress,
  disabled = false,
}: TaskRowProps) {
  const { colors } = useTheme();
  const dueLabel = formatDueLabel(task.dueDate);
  const overdue = isTaskOverdue(task.dueDate, task.completed);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.completed ? 'completed' : 'incomplete'}`}
      disabled={disabled}
      onPress={() => {
        onPress(task);
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
          opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
        },
      ]}>
      <Checkbox
        checked={task.completed}
        disabled={disabled}
        accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
        onToggle={() => {
          onToggle(task);
        }}
      />

      <View style={styles.content}>
        <Text
          variant="bodyStrong"
          numberOfLines={2}
          muted={task.completed}
          style={task.completed ? styles.struck : undefined}>
          {task.title}
        </Text>

        <View style={styles.meta}>
          {dueLabel ? (
            <Text variant="caption" danger={overdue} muted={!overdue}>
              {dueLabel}
            </Text>
          ) : null}
          <PriorityBadge priority={task.priority} />
        </View>
      </View>
    </Pressable>
  );
}

export const TaskRow = memo(TaskRowInner);

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget.rowMin,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    paddingLeft: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
