import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import type { AuthStackParamList } from '../../../app/navigation';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Text } from '../../../components/ui/Text';
import { useTheme } from '../../../theme/ThemeProvider';
import { spacing, touchTarget } from '../../../theme/tokens';
import { AppError } from '../../../types/api';
import { loginRequest } from '../api';
import { useAuthStore } from '../store';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const payload = await loginRequest(values);
      await setSession(payload);
    } catch (err) {
      if (err instanceof AppError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to sign in right now. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing['3xl'],
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}>
        <View style={styles.header}>
          <Text variant="label" accent>
            DAYBOOK
          </Text>
          <Text variant="display">Welcome back</Text>
          <Text variant="body" muted>
            Sign in to pick up today&apos;s notes and tasks.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                error={errors.password?.message}
                rightSlot={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    hitSlop={8}
                    onPress={() => {
                      setShowPassword((prev) => !prev);
                    }}
                    style={styles.eyeButton}>
                    {showPassword ? (
                      <EyeOff size={20} color={colors.inkMuted} />
                    ) : (
                      <Eye size={20} color={colors.inkMuted} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          {serverError ? (
            <Text variant="caption" danger accessibilityLiveRegion="polite">
              {serverError}
            </Text>
          ) : null}

          <Button
            label="Sign in"
            loading={isSubmitting}
            onPress={() => {
              handleSubmit(onSubmit)().catch(() => {});
            }}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('Register');
            }}
            style={styles.linkButton}>
            <Text variant="body" muted>
              New to Daybook?{' '}
              <Text variant="bodyStrong" accent>
                Create an account
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    justifyContent: 'space-between',
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  eyeButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  footer: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  linkButton: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
