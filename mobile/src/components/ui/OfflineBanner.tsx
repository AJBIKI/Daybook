import { WifiOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface OfflineBannerProps {
  visible?: boolean;
  message?: string;
}

export function OfflineBanner({
  visible = true,
  message = "You're offline — cached tasks are still visible.",
}: OfflineBannerProps) {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: colors.surface,
          borderColor: colors.danger,
        },
      ]}>
      <WifiOff size={16} color={colors.danger} />
      <Text variant="caption" danger style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
