import {
  Check,
  Moon,
  Smartphone,
  Sun,
  User as UserIcon,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Text } from '../../../components/ui/Text';
import { triggerLightHaptic } from '../../../lib/haptics';
import { useIsOnline } from '../../../lib/useIsOnline';
import { useTheme } from '../../../theme/ThemeProvider';
import { spacing, touchTarget } from '../../../theme/tokens';
import type { ThemeMode } from '../../../theme/tokens';
import { useAuthStore } from '../../auth/store';

interface AppearanceOption {
  value: ThemeMode;
  label: string;
  description: string;
  Icon: typeof Smartphone;
}

const APPEARANCE_OPTIONS: AppearanceOption[] = [
  {
    value: 'system',
    label: 'System default',
    description: 'Matches your Android device display settings',
    Icon: Smartphone,
  },
  {
    value: 'light',
    label: 'Light theme',
    description: 'Warm paper background with charcoal ink',
    Icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark theme',
    description: 'Deep black background with mint accents',
    Icon: Moon,
  },
];

function getInitials(name?: string | null): string {
  if (!name || name.trim().length === 0) {
    return 'D';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'D';
  }
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isOnline = useIsOnline();

  const handleSelectTheme = (selectedMode: ThemeMode) => {
    triggerLightHaptic();
    setMode(selectedMode).catch(() => {});
  };

  const handleLogoutPrompt = () => {
    Alert.alert(
      'Log out of Daybook?',
      `Are you sure you want to log out, ${user?.name ?? 'friend'}? Your saved tasks remain securely synced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            triggerLightHaptic();
            logout().catch(() => {});
          },
        },
      ],
    );
  };

  const initials = getInitials(user?.name);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl * 2,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="PREFERENCES"
          title="Settings"
          subtitle="Manage your profile, theme, and account session."
          display
        />

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.accent,
                },
              ]}>
              {user?.name ? (
                <Text variant="heading" accent>
                  {initials}
                </Text>
              ) : (
                <UserIcon size={22} color={colors.accent} />
              )}
            </View>
            <View style={styles.profileCopy}>
              <Text variant="title" numberOfLines={1}>
                {user?.name ?? 'Daybook Member'}
              </Text>
              <Text variant="body" muted numberOfLines={1}>
                {user?.email ?? 'Signed in'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusDivider, { backgroundColor: colors.line }]} />

          <View style={styles.sessionStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.accent : colors.danger },
              ]}
            />
            <Text variant="caption" muted>
              {isOnline
                ? 'Connected to Daybook Cloud'
                : 'Offline · cached tasks visible'}
            </Text>
          </View>
        </Card>

        {/* Appearance Control */}
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionHeader}>
            APPEARANCE
          </Text>

          <Card padded={false} style={styles.optionsCard}>
            {APPEARANCE_OPTIONS.map((option, index) => {
              const isSelected = mode === option.value;
              const isLast = index === APPEARANCE_OPTIONS.length - 1;
              const { Icon } = option;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label}: ${option.description}`}
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    handleSelectTheme(option.value);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      backgroundColor: pressed ? colors.accentSoft : 'transparent',
                      borderBottomColor: colors.line,
                      borderBottomWidth: isLast ? 0 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? colors.accentSoft
                          : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.line,
                      },
                    ]}>
                    <Icon
                      size={18}
                      color={isSelected ? colors.accent : colors.inkMuted}
                    />
                  </View>

                  <View style={styles.optionCopy}>
                    <Text variant="bodyStrong">{option.label}</Text>
                    <Text variant="caption" muted>
                      {option.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected
                        ? {
                            borderColor: colors.accent,
                            backgroundColor: colors.accent,
                          }
                        : { borderColor: colors.line },
                    ]}>
                    {isSelected ? (
                      <Check
                        size={12}
                        color={colors.onAccent}
                        strokeWidth={3}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* Application Info */}
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionHeader}>
            ABOUT DAYBOOK
          </Text>

          <Card style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text variant="caption" muted>
                Version
              </Text>
              <Text variant="bodyStrong">1.0.0 (Build 1)</Text>
            </View>
            <View style={[styles.aboutDivider, { backgroundColor: colors.line }]} />
            <View style={styles.aboutRow}>
              <Text variant="caption" muted>
                Engine
              </Text>
              <Text variant="bodyStrong">React Native CLI · Hermes</Text>
            </View>
            <View style={[styles.aboutDivider, { backgroundColor: colors.line }]} />
            <View style={styles.aboutRow}>
              <Text variant="caption" muted>
                Backend
              </Text>
              <Text variant="bodyStrong">Express · TypeScript · MongoDB</Text>
            </View>
          </Card>
        </View>

        {/* Session Management */}
        <View style={styles.section}>
          <Text variant="label" muted style={styles.sectionHeader}>
            ACCOUNT
          </Text>

          <Button
            label="Log out"
            variant="danger"
            onPress={handleLogoutPrompt}
            accessibilityLabel="Log out of Daybook account"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screen,
    gap: spacing.xl,
  },
  profileCard: {
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  statusDivider: {
    height: 1,
  },
  sessionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
  },
  optionsCard: {
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCard: {
    gap: spacing.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutDivider: {
    height: 1,
  },
});
