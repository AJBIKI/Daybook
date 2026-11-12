import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { typography, type TypographyVariant } from '../../theme/typography';

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  muted?: boolean;
  danger?: boolean;
  accent?: boolean;
}

export function Text({
  variant = 'body',
  color,
  muted = false,
  danger = false,
  accent = false,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const resolvedColor =
    color ??
    (danger
      ? colors.danger
      : accent
        ? colors.accent
        : muted
          ? colors.inkMuted
          : colors.ink);

  return (
    <RNText
      allowFontScaling
      style={[typography[variant], { color: resolvedColor }, style]}
      {...rest}
    />
  );
}
