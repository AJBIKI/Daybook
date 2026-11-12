import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/ui/Text';
import { useAuthStore } from '../features/auth/store';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { RootNavigator } from './navigation';
import { AppProviders } from './providers';

function AppShell() {
  const { colors, isDark } = useTheme();
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      {isServerWaking ? (
        <View
          pointerEvents="none"
          style={[
            styles.wakingHint,
            {
              top: insets.top + spacing.sm,
              backgroundColor: colors.surface,
              borderColor: colors.line,
            },
          ]}>
          <Text variant="caption" muted>
            Waking up the server…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wakingHint: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
