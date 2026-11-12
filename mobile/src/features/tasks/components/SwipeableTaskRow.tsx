import { Check, Trash2 } from 'lucide-react-native';
import React, { memo, useCallback, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { TaskRow } from '../../../components/ui/TaskRow';
import { Text } from '../../../components/ui/Text';
import { useTheme } from '../../../theme/ThemeProvider';
import { radius, spacing } from '../../../theme/tokens';
import type { Task } from '../../../types/task';

export interface SwipeableTaskRowProps {
  task: Task;
  onToggle: (task: Task) => void;
  onPress: (task: Task) => void;
  onDelete: (task: Task) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 84;
const MAX_TRANSLATE = 112;

function SwipeableTaskRowInner({
  task,
  onToggle,
  onPress,
  onDelete,
  disabled = false,
}: SwipeableTaskRowProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  const triggerComplete = useCallback(() => {
    onToggle(task);
  }, [onToggle, task]);

  const triggerDeletePrompt = useCallback(() => {
    Alert.alert(
      'Delete task?',
      `"${task.title}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(task);
          },
        },
      ],
    );
  }, [onDelete, task]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          const clamped = Math.max(
            -MAX_TRANSLATE,
            Math.min(MAX_TRANSLATE, event.translationX),
          );
          translateX.value = clamped;
        })
        .onEnd((event) => {
          if (event.translationX >= SWIPE_THRESHOLD) {
            scheduleOnRN(triggerComplete);
          } else if (event.translationX <= -SWIPE_THRESHOLD) {
            scheduleOnRN(triggerDeletePrompt);
          }
          translateX.value = reducedMotion
            ? 0
            : withTiming(0, { duration: 180 });
        }),
    [disabled, reducedMotion, triggerComplete, triggerDeletePrompt, translateX],
  );

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const completeBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 8 ? 1 : 0,
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -8 ? 1 : 0,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          styles.leftBackdrop,
          { backgroundColor: colors.accent },
          completeBgStyle,
        ]}>
        <Check size={18} color={colors.onAccent} strokeWidth={2.25} />
        <Text variant="caption" color={colors.onAccent}>
          {task.completed ? 'Reopen' : 'Complete'}
        </Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          styles.rightBackdrop,
          { backgroundColor: colors.danger },
          deleteBgStyle,
        ]}>
        <Text variant="caption" color={colors.onAccent}>
          Delete
        </Text>
        <Trash2 size={18} color={colors.onAccent} strokeWidth={2.25} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardAnimatedStyle}>
          <TaskRow
            task={task}
            onToggle={onToggle}
            onPress={onPress}
            disabled={disabled}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export const SwipeableTaskRow = memo(SwipeableTaskRowInner);

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  leftBackdrop: {
    justifyContent: 'flex-start',
  },
  rightBackdrop: {
    justifyContent: 'flex-end',
  },
});
