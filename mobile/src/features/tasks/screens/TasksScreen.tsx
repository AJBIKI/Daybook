import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListTodo, SearchX } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
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
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Text } from '../../../components/ui/Text';
import { useToast } from '../../../components/ui/Toast';
import {
  getOverdueUpperBound,
  getUpcomingLowerBound,
} from '../../../lib/dates';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { useIsOnline } from '../../../lib/useIsOnline';
import { useTheme } from '../../../theme/ThemeProvider';
import { spacing } from '../../../theme/tokens';
import type {
  Task,
  TaskListFilters,
  TaskPriority,
  TaskStatusFilter,
} from '../../../types/task';
import { useAuthStore } from '../../auth/store';
import {
  DEFAULT_SORT_OPTION,
  type DuePresetFilter,
  FilterBar,
  SORT_OPTIONS,
  type SortOption,
  type SortOptionId,
} from '../components/FilterBar';
import { SwipeableTaskRow } from '../components/SwipeableTaskRow';
import {
  useDeleteTaskMutation,
  useInfiniteTasksQuery,
  useToggleTaskMutation,
} from '../hooks';

const PAGE_SIZE = 20;

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export function TasksScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  const { showToast } = useToast();

  const tabNav = useNavigation<BottomTabNavigationProp<AppTabsParamList, 'Tasks'>>();
  const route = useRoute<RouteProp<AppTabsParamList, 'Tasks'>>();
  const stackNav =
    tabNav.getParent<NativeStackNavigationProp<AuthenticatedStackParamList>>();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<TaskStatusFilter>('all');
  const [priority, setPriority] = useState<TaskPriority | undefined>(undefined);
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION);
  const [duePreset, setDuePreset] = useState<DuePresetFilter>(null);

  useEffect(() => {
    const preset = route.params?.preset;
    if (!preset) {
      return;
    }
    setStatus('active');
    setPriority(undefined);
    setDuePreset(preset);
    setSortOption(
      SORT_OPTIONS.find((item) => item.id === 'dueSoon') ?? DEFAULT_SORT_OPTION,
    );
  }, [route.params?.nonce, route.params?.preset]);

  const filters: TaskListFilters = useMemo(() => {
    const next: TaskListFilters = {
      status,
      sortBy: sortOption.sortBy,
      order: sortOption.order,
      limit: PAGE_SIZE,
    };
    if (priority !== undefined) {
      next.priority = priority;
    }
    if (debouncedSearch.trim().length > 0) {
      next.q = debouncedSearch.trim();
    }
    if (duePreset === 'overdue') {
      next.dueTo = getOverdueUpperBound();
    } else if (duePreset === 'upcoming') {
      next.dueFrom = getUpcomingLowerBound();
    }
    return next;
  }, [status, priority, debouncedSearch, sortOption, duePreset]);

  const tasksQuery = useInfiniteTasksQuery(filters);
  const toggleMutation = useToggleTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const tasks = useMemo(
    () => tasksQuery.data?.pages.flatMap((page) => page.tasks) ?? [],
    [tasksQuery.data],
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    status !== 'all' ||
    priority !== undefined ||
    duePreset !== null;

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setStatus('all');
    setPriority(undefined);
    setDuePreset(null);
  }, []);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortOption(option);
  }, []);

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

  const handlePressTask = useCallback(
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
    stackNav?.navigate('TaskModal');
  }, [isOnline, showToast, stackNav]);

  const handleEndReached = useCallback(() => {
    if (tasksQuery.hasNextPage && !tasksQuery.isFetchingNextPage) {
      tasksQuery.fetchNextPage().catch(() => {});
    }
  }, [tasksQuery]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Task>) => (
      <SwipeableTaskRow
        task={item}
        disabled={!isOnline}
        onToggle={handleToggle}
        onPress={handlePressTask}
        onDelete={handleDelete}
      />
    ),
    [isOnline, handleToggle, handlePressTask, handleDelete],
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.headerArea,
          { paddingTop: insets.top + spacing.lg },
        ]}>
        <OfflineBanner visible={!isOnline} />

        {isOnline && isServerWaking ? (
          <Card style={styles.wakingCard}>
            <Text variant="caption" accent>
              Waking up the server…
            </Text>
          </Card>
        ) : null}

        <ScreenHeader
          title="Tasks"
          subtitle="Search, filter, and organize everything in your daybook."
        />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          sortId={sortOption.id as SortOptionId}
          onSortChange={handleSortChange}
          duePreset={duePreset}
          onClearDuePreset={() => {
            setDuePreset(null);
          }}
        />
      </View>

      {tasksQuery.isPending ? (
        <View style={styles.skeletonList}>
          <Skeleton height={68} borderRadius={20} />
          <Skeleton height={68} borderRadius={20} />
          <Skeleton height={68} borderRadius={20} />
          <Skeleton height={68} borderRadius={20} />
        </View>
      ) : tasksQuery.isError && tasks.length === 0 ? (
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <Text variant="heading">Unable to load tasks</Text>
            <Text variant="caption" muted>
              {tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : 'Check your connection and try again.'}
            </Text>
            <Button
              label="Retry"
              variant="secondary"
              onPress={() => {
                tasksQuery.refetch().catch(() => {});
              }}
            />
          </Card>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isRefetching && !tasksQuery.isFetchingNextPage}
              onRefresh={() => {
                tasksQuery.refetch().catch(() => {});
              }}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            hasActiveFilters ? (
              <EmptyState
                icon={<SearchX size={22} color={colors.accent} />}
                title="No matching tasks"
                message="Try clearing your search or switching status filters."
                actionLabel="Clear filters"
                onAction={clearAllFilters}
              />
            ) : (
              <EmptyState
                icon={<ListTodo size={22} color={colors.accent} />}
                title="No tasks yet"
                message="Add your first task to start organizing your daybook."
                actionLabel={isOnline ? 'Add task' : undefined}
                onAction={isOnline ? handleOpenCreate : undefined}
              />
            )
          }
          ListFooterComponent={
            tasksQuery.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : tasks.length > 0 && !tasksQuery.hasNextPage ? (
              <View style={styles.footer}>
                <Text variant="caption" muted>
                  All caught up
                </Text>
              </View>
            ) : undefined
          }
        />
      )}

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
  headerArea: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  wakingCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skeletonList: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  errorContainer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  errorCard: {
    gap: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.screen,
  },
});
