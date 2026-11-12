import { Plus } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/tokens';

export interface FABProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function FAB({
  onPress,
  disabled = false,
  accessibilityLabel = 'Add task',
  style,
}: FABProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
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
          styles.fab,
          {
            backgroundColor: colors.accent,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          },
        ]}>
        <Plus size={24} color={colors.onAccent} strokeWidth={2.25} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
});
