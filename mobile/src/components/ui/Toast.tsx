import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type ToastTone = 'info' | 'error' | 'success';

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({ message, tone });
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, 3200);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? <ToastBanner message={toast.message} tone={toast.tone} onDismiss={dismiss} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastBanner({
  message,
  tone = 'info',
  onDismiss,
}: {
  message: string;
  tone?: ToastTone;
  onDismiss?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const backgroundColor =
    tone === 'error'
      ? colors.danger
      : tone === 'success'
        ? colors.accent
        : colors.ink;
  const textColor = tone === 'info' ? colors.bg : colors.onAccent;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: insets.bottom + spacing['2xl'] }]}>
      <Pressable
        accessibilityRole="alert"
        onPress={onDismiss}
        style={[styles.pill, { backgroundColor }]}>
        <Text variant="caption" color={textColor}>
          {message}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
