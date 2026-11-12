import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sun } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  AppTabsParamList,
  AuthenticatedStackParamList,
} from '../../../app/navigationTypes';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FAB } from '../../../components/ui/FAB';
import { OfflineBanner } from '../../../components/ui/OfflineBanner';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatCard } from '../../../components/ui/StatCard';
import { Text } from '../../../components/ui/Text';
import { useToast } from '../../../components/ui/Toast';
import {
  formatTodayHeader,
  getOverdueUpperBound,
  getTodayBoundaries,
} from '../../../lib/dates';
import { useIsOnline } from '../../../lib/useIsOnline';
import { useTheme } from '../../../theme/ThemeProvider';
import { spacing } from '../../../theme/tokens';
import type { Task, TaskListFilters } from '../../../types/task';
import { useAuthStore } from '../../auth/store';
import { SwipeableTaskRow } from '../components/SwipeableTaskRow';
import {
  useDeleteTaskMutation,
  useInfiniteTasksQuery,
  useTaskSummaryQuery,
  useToggleTaskMutation,
} from '../hooks';

export function TodayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  const { showToast } = useToast();

  const tabNav = useNavigation<BottomTabNavigationProp<AppTabsParamList, 'Today'>>();
  const stackNav =
    tabNav.getParent<NativeStackNavigationProp<AuthenticatedStackParamList>>();

  const [daySnapshot, setDaySnapshot] = useState(() => ({
    boundaries: getTodayBoundaries(),
    overdueUpper: getOverdueUpperBound(),
    headerText: formatTodayHeader(),
  }));

  const refreshDaySnapshotIfNeeded = useCallback(() => {
    const nextBoundaries = getTodayBoundaries();
    setDaySnapshot((prev) =>
      prev.boundaries.dueFrom === nextBoundaries.dueFrom
        ? prev
        : {
            boundaries: nextBoundaries,
            overdueUpper: getOverdueUpperBound(),
            headerText: formatTodayHeader(),
          },
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDaySnapshotIfNeeded();
    }, [refreshDaySnapshotIfNeeded]),
  );

  const { boundaries, overdueUpper, headerText } = daySnapshot;

  const todayFilters: TaskListFilters = useMemo(
    () => ({
      status: 'all',
      dueFrom: boundaries.dueFrom,
      dueTo: boundaries.dueTo,
      sortBy: 'dueDate',
      order: 'asc',
      limit: 50,
    }),
    [boundaries],
  );

  const overdueFilters: TaskListFilters = useMemo(
    () => ({
      status: 'active',
      dueTo: overdueUpper,
      sortBy: 'dueDate',
      order: 'asc',
      limit: 50,
    }),
    [overdueUpper],
  );

  const summaryQuery = useTaskSummaryQuery(boundaries);
  const todayQuery = useInfiniteTasksQuery(todayFilters);
  const overdueQuery = useInfiniteTasksQuery(overdueFilters);

  const toggleMutation = useToggleTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const todayTasks = useMemo(
    () => todayQuery.data?.pages.flatMap((page) => page.tasks) ?? [],
    [todayQuery.data],
  );

  const overdueTasks = useMemo(
    () => overdueQuery.data?.pages.flatMap((page) => page.tasks) ?? [],
    [overdueQuery.data],
  );

  const totalToday = summaryQuery.data?.today.total ?? 0;
  const completedToday = summaryQuery.data?.today.completed ?? 0;
  const progress = totalToday === 0 ? 0 : completedToday / totalToday;

  const isRefreshing =
    (summaryQuery.isRefetching ||
      todayQuery.isRefetching ||
      overdueQuery.isRefetching) &&
    !summaryQuery.isPending;

  const isInitialLoading =
    summaryQuery.isPending || todayQuery.isPending || overdueQuery.isPending;

  const hasInitialError =
    (summaryQuery.isError || todayQuery.isError) &&
    !summaryQuery.data &&
    todayTasks.length === 0;

  const handleRefresh = useCallback(() => {
    refreshDaySnapshotIfNeeded();
    summaryQuery.refetch().catch(() => {});
    todayQuery.refetch().catch(() => {});
    overdueQuery.refetch().catch(() => {});
  }, [refreshDaySnapshotIfNeeded, summaryQuery, todayQuery, overdueQuery]);

  const handleToggle = useCallback(
    (task: Task) => {
      if (!isOnline) {
        showToast('You are offline. Reconnect to update tasks.', 'error');
        return;
      }
      toggleMutation.mutate(task);
    },
    [isOnline, showToast, toggleMutation],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      if (!isOnline) {
        showToast('You are offline. Reconnect to delete tasks.', 'error');
        return;
      }
      deleteMutation.mutate(task.id);
    },
    [isOnline, showToast, deleteMutation],
  );

  const handleOpenTask = useCallback(
    (task: Task) => {
      stackNav?.navigate('TaskModal', {
        taskId: task.id,
        initialTask: task,
      });
    },
    [stackNav],
  );

  const handleOpenCreate = useCallback(() => {
    if (!isOnline) {
      showToast('You are offline. Reconnect to add tasks.', 'error');
      return;
    }
    stackNav?.navigate('TaskModal', { defaultDuePreset: 'today' });
  }, [isOnline, showToast, stackNav]);

  const progressSubtitle =
    totalToday === 0
      ? 'No tasks scheduled for today.'
      : completedToday >= totalToday
        ? 'Everything scheduled for today is complete.'
        : `${totalToday - completedToday} remaining today.`;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        <OfflineBanner visible={!isOnline} />

        {isOnline && isServerWaking ? (
          <Card style={styles.wakingCard}>
            <Text variant="caption" accent>
              Waking up the server…
            </Text>
          </Card>
        ) : null}

        <ScreenHeader
          eyebrow={headerText.weekdayEyebrow}
          title={headerText.dateTitle}
          display
        />

        <Card style={styles.progressCard}>
          <ProgressRing progress={progress} size={80} />
          <View style={styles.progressCopy}>
            <Text variant="title">
              {completedToday} of {totalToday} done
            </Text>
            <Text variant="caption" muted>
              {progressSubtitle}
            </Text>
          </View>
        </Card>

        <View style={styles.bentoRow}>
          <StatCard
            label="Overdue"
            value={summaryQuery.data?.overdue ?? 0}
            tone="danger"
            onPress={() => {
              tabNav.navigate('Tasks', {
                preset: 'overdue',
                nonce: Date.now(),
              });
            }}
          />
          <StatCard
            label="Upcoming"
            value={summaryQuery.data?.upcoming ?? 0}
            tone="accent"
            onPress={() => {
              tabNav.navigate('Tasks', {
                preset: 'upcoming',
                nonce: Date.now(),
              });
            }}
          />
        </View>

        {isInitialLoading ? (
          <View style={styles.section}>
            <Skeleton height={68} borderRadius={20} />
            <Skeleton height={68} borderRadius={20} />
            <Skeleton height={68} borderRadius={20} />
          </View>
        ) : hasInitialError ? (
          <Card style={styles.errorCard}>
            <Text variant="heading">Could not load Today</Text>
            <Text variant="caption" muted>
              {summaryQuery.error instanceof Error
                ? summaryQuery.error.message
                : 'Check your connection and try again.'}
            </Text>
            <Button
              label="Retry"
              variant="secondary"
              onPress={handleRefresh}
            />
          </Card>
        ) : overdueTasks.length === 0 && todayTasks.length === 0 ? (
          <EmptyState
            icon={<Sun size={22} color={colors.accent} />}
            title="Nothing due today"
            message="Your daybook is clear. Capture a task whenever something comes to mind."
            actionLabel={isOnline ? 'Add task' : undefined}
            onAction={isOnline ? handleOpenCreate : undefined}
          />
        ) : (
          <>
            {overdueTasks.length > 0 ? (
              <View style={styles.section}>
                <Text variant="label" danger>
                  Overdue · {overdueTasks.length}
                </Text>
                {overdueTasks.map((task) => (
                  <SwipeableTaskRow
                    key={task.id}
                    task={task}
                    disabled={!isOnline}
                    onToggle={handleToggle}
                    onPress={handleOpenTask}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text variant="label" muted>
                Today · {todayTasks.length}
              </Text>
              {todayTasks.length === 0 ? (
                <Card>
                  <Text variant="body" muted>
                    No tasks scheduled specifically for today.
                  </Text>
                </Card>
              ) : (
                todayTasks.map((task) => (
                  <SwipeableTaskRow
                    key={task.id}
                    task={task}
                    disabled={!isOnline}
                    onToggle={handleToggle}
                    onPress={handleOpenTask}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <FAB
        onPress={handleOpenCreate}
        disabled={!isOnline}
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
      />
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
  wakingCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  errorCard: {
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.screen,
  },
});
