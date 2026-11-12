import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '../components/ui/Toast';
import { useAuthStore } from '../features/auth/store';
import { configureApiClient } from '../lib/apiClient';
import { queryClient, setupQueryManagers } from '../lib/queryClient';
import { ThemeProvider } from '../theme/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const resetSessionSync = useAuthStore((s) => s.resetSessionSync);
  const setServerWaking = useAuthStore((s) => s.setServerWaking);

  useEffect(() => {
    configureApiClient({
      getToken: () => useAuthStore.getState().token,
      onUnauthorized: resetSessionSync,
      onSlowRequestChange: setServerWaking,
    });

    hydrateSession().catch(() => {});
    const cleanupManagers = setupQueryManagers();

    return () => {
      cleanupManagers();
    };
  }, [hydrateSession, resetSessionSync, setServerWaking]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
