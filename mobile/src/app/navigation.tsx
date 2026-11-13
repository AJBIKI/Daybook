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
  Settings as SettingsIcon,
} from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '../components/ui/Text';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { useAuthStore } from '../features/auth/store';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { TaskModalScreen } from '../features/tasks/screens/TaskModalScreen';
import { TasksScreen } from '../features/tasks/screens/TasksScreen';
import { TodayScreen } from '../features/tasks/screens/TodayScreen';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import type {
  AppTabsParamList,
  AuthStackParamList,
  AuthenticatedStackParamList,
} from './navigationTypes';

export type {
  AppTabsParamList,
  AuthStackParamList,
  AuthenticatedStackParamList,
} from './navigationTypes';

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const AuthenticatedStackNav =
  createNativeStackNavigator<AuthenticatedStackParamList>();
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
        component={TodayScreen}
        options={{
          tabBarIcon: renderTodayIcon,
        }}
      />
      <TabsNav.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: renderTasksIcon,
        }}
      />
      <TabsNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: renderSettingsIcon,
        }}
      />
    </TabsNav.Navigator>
  );
}

function AuthenticatedStack() {
  const { colors } = useTheme();

  return (
    <AuthenticatedStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <AuthenticatedStackNav.Screen name="AppTabs" component={AppTabs} />
      <AuthenticatedStackNav.Screen
        name="TaskModal"
        component={TaskModalScreen}
        options={{ presentation: 'modal' }}
      />
    </AuthenticatedStackNav.Navigator>
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
      {token ? <AuthenticatedStack /> : <AuthStack />}
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
});
