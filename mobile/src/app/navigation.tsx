import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CalendarCheck2,
  ListTodo,
  Palette,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Text } from '../components/ui/Text';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { useAuthStore } from '../features/auth/store';
import { GalleryScreen } from '../features/gallery/GalleryScreen';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Gallery: undefined;
};

export type AppTabsParamList = {
  Today: undefined;
  Tasks: undefined;
  Settings: undefined;
  Gallery?: undefined;
};

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const TabsNav = createBottomTabNavigator<AppTabsParamList>();

function BrandedBootScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.bootContainer, { backgroundColor: colors.bg }]}>
      <Text variant="label" accent>
        DAYBOOK
      </Text>
      <Text variant="display">Daybook</Text>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

function PhaseThreePlaceholder({
  title,
  description,
  showLogout = false,
}: {
  title: string;
  description: string;
  showLogout?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View
      style={[
        styles.placeholderContainer,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}>
      <ScreenHeader
        eyebrow="PHASE 3 SESSION ACTIVE"
        title={title}
        subtitle={description}
        display
      />
      <Card style={styles.cardGap}>
        <Text variant="label" muted>
          Signed in user
        </Text>
        <Text variant="heading">{user?.name ?? 'Authenticated session'}</Text>
        <Text variant="body" muted>
          {user?.email ?? 'Token loaded from Keychain'}
        </Text>
        {showLogout ? (
          <Button
            label="Log out"
            variant="danger"
            onPress={() => {
              logout().catch(() => {});
            }}
          />
        ) : null}
      </Card>
    </View>
  );
}

function TodayPlaceholder() {
  return (
    <PhaseThreePlaceholder
      title="Today"
      description="Today summary and due tasks arrive in Phase 4."
    />
  );
}

function TasksPlaceholder() {
  return (
    <PhaseThreePlaceholder
      title="Tasks"
      description="Infinite task list, search, and filters arrive in Phase 4."
    />
  );
}

function SettingsPlaceholder() {
  return (
    <PhaseThreePlaceholder
      title="Settings"
      description="Appearance controls and account actions."
      showLogout
    />
  );
}

function AuthStack() {
  const { colors } = useTheme();

  return (
    <AuthStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      {__DEV__ ? (
        <AuthStackNav.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            headerShown: true,
            title: 'UI Kit Gallery',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.ink,
          }}
        />
      ) : null}
    </AuthStackNav.Navigator>
  );
}

function renderTodayIcon({ color, size }: { color: string; size: number }) {
  return <CalendarCheck2 size={size} color={color} />;
}

function renderTasksIcon({ color, size }: { color: string; size: number }) {
  return <ListTodo size={size} color={color} />;
}

function renderSettingsIcon({ color, size }: { color: string; size: number }) {
  return <SettingsIcon size={size} color={color} />;
}

function renderGalleryIcon({ color, size }: { color: string; size: number }) {
  return <Palette size={size} color={color} />;
}

function AppTabs() {
  const { colors } = useTheme();

  return (
    <TabsNav.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
      }}>
      <TabsNav.Screen
        name="Today"
        component={TodayPlaceholder}
        options={{
          tabBarIcon: renderTodayIcon,
        }}
      />
      <TabsNav.Screen
        name="Tasks"
        component={TasksPlaceholder}
        options={{
          tabBarIcon: renderTasksIcon,
        }}
      />
      <TabsNav.Screen
        name="Settings"
        component={SettingsPlaceholder}
        options={{
          tabBarIcon: renderSettingsIcon,
        }}
      />
      {__DEV__ ? (
        <TabsNav.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            tabBarIcon: renderGalleryIcon,
          }}
        />
      ) : null}
    </TabsNav.Navigator>
  );
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const token = useAuthStore((s) => s.token);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) {
    return <BrandedBootScreen />;
  }

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.surface,
      text: colors.ink,
      border: colors.line,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  placeholderContainer: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    gap: spacing.xl,
  },
  cardGap: {
    gap: spacing.sm,
  },
});
