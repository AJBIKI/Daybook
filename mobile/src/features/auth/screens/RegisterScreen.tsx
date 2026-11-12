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
import { registerRequest } from '../api';
import { useAuthStore } from '../store';

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const payload = await registerRequest(values);
      await setSession(payload);
    } catch (err) {
      if (err instanceof AppError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to create account right now. Please try again.');
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
          <Text variant="display">Start your daybook</Text>
          <Text variant="body" muted>
            A calm place for the tasks that matter today.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Asha Rao"
                autoComplete="name"
                returnKeyType="next"
                error={errors.name?.message}
              />
            )}
          />

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
                placeholder="8 to 72 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
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
            label="Create account"
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
              navigation.navigate('Login');
            }}
            style={styles.linkButton}>
            <Text variant="body" muted>
              Already have an account?{' '}
              <Text variant="bodyStrong" accent>
                Sign in
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
    alignItems: 'center',
  },
  linkButton: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
