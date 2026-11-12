import React, { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  rightSlot?: ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  rightSlot,
  editable = true,
  multiline = false,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.accent
      : colors.line;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text variant="label" muted style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.fieldContainer,
          multiline ? styles.multilineContainer : null,
          !editable ? styles.disabledField : null,
          {
            backgroundColor: colors.surface,
            borderColor,
          },
        ]}>
        <TextInput
          editable={editable}
          multiline={multiline}
          placeholderTextColor={colors.inkMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            typography.body,
            styles.input,
            multiline ? styles.multilineInput : null,
            { color: colors.ink },
            style,
          ]}
          {...rest}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>

      {error ? (
        <Text variant="caption" danger style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" muted style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.sm,
  },
  fieldContainer: {
    minHeight: touchTarget.control,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineContainer: {
    minHeight: 108,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  disabledField: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 84,
  },
  rightSlot: {
    marginLeft: spacing.sm,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
