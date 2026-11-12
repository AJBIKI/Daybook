import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';

export interface CardProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
}

export function Card({
  children,
  padded = true,
  style,
  ...rest
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        padded ? styles.padded : null,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
