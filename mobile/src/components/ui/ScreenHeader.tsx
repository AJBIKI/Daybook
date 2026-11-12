import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { Text } from './Text';

export interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  display?: boolean;
  rightSlot?: ReactNode;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  display = false,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        {eyebrow ? (
          <Text variant="label" accent>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant={display ? 'display' : 'title'}>{title}</Text>
        {subtitle ? (
          <Text variant="body" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  rightSlot: {
    paddingTop: spacing.xs,
  },
});
