import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ToastProvider } from '../src/components/ui/Toast';
import type { TaskListPage } from '../src/features/tasks/api';
import * as tasksApi from '../src/features/tasks/api';
import { useToggleTaskMutation } from '../src/features/tasks/hooks';
import { taskKeys } from '../src/features/tasks/queryKeys';
import {
  buildQuickDueDate,
  formatDueLabel,
  getOverdueUpperBound,
  getTodayBoundaries,
  getUpcomingLowerBound,
} from '../src/lib/dates';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AppError } from '../src/types/api';
import type { Task, TaskSummary } from '../src/types/task';

describe('Task date helpers', () => {
  it('produces valid day boundaries and non-overlapping overdue/upcoming bounds', () => {
    const { dueFrom, dueTo } = getTodayBoundaries();
    const overdueUpper = getOverdueUpperBound();
    const upcomingLower = getUpcomingLowerBound();

    expect(new Date(dueFrom).getTime()).toBeLessThan(new Date(dueTo).getTime());
    expect(new Date(overdueUpper).getTime()).toBeLessThan(
      new Date(dueFrom).getTime(),
    );
    expect(new Date(upcomingLower).getTime()).toBeGreaterThan(
      new Date(dueTo).getTime(),
    );
  });

  it('formats Today due labels cleanly and sets quick dates', () => {
    const todayFivePm = buildQuickDueDate('today');
    const tomorrowNineAm = buildQuickDueDate('tomorrow');
    const nextWeekNineAm = buildQuickDueDate('nextWeek');

    expect(formatDueLabel(null)).toBeNull();
    expect(formatDueLabel(todayFivePm.toISOString())).toContain('Today,');
    expect(formatDueLabel(tomorrowNineAm.toISOString())).toContain('Tomorrow,');
    expect(nextWeekNineAm.getTime()).toBeGreaterThan(tomorrowNineAm.getTime());
  });
});

describe('useToggleTaskMutation', () => {
  it('optimistically updates cached task lists and summary, then rolls back on error', async () => {
    jest.useFakeTimers();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const boundaries = getTodayBoundaries();
    const sampleTask: Task = {
      id: 'task-1',
      userId: 'user-1',
      title: 'Draft release notes',
      notes: '',
      priority: 2,
      dueDate: new Date().toISOString(),
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const listKey = taskKeys.list({ status: 'all' });
    const summaryKey = taskKeys.summary(boundaries);

    queryClient.setQueryData<InfiniteData<TaskListPage>>(listKey, {
      pageParams: [1],
      pages: [
        {
          tasks: [sampleTask],
          meta: { page: 1, limit: 20, total: 1, hasNextPage: false },
        },
      ],
    });
    queryClient.setQueryData<TaskSummary>(summaryKey, {
      today: { total: 1, completed: 0 },
      overdue: 0,
      upcoming: 0,
    });

    let rejectMutation!: (reason?: unknown) => void;
    const spy = jest.spyOn(tasksApi, 'updateTaskRequest').mockImplementation(
      () =>
        new Promise<Task>((_resolve, reject) => {
          rejectMutation = reject;
        }),
    );

    let mutateTask!: (t: Task) => void;
    function Harness() {
      const mutation = useToggleTaskMutation();
      mutateTask = mutation.mutate;
      return null;
    }

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    try {
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 390, height: 844 },
              insets: { top: 44, left: 0, right: 0, bottom: 34 },
            }}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <ToastProvider>
                  <Harness />
                </ToastProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </SafeAreaProvider>,
        );
      });

      await act(async () => {
        mutateTask(sampleTask);
      });

      const optimisticList =
        queryClient.getQueryData<InfiniteData<TaskListPage>>(listKey);
      const optimisticSummary = queryClient.getQueryData<TaskSummary>(summaryKey);

      expect(optimisticList?.pages[0]?.tasks[0]?.completed).toBe(true);
      expect(optimisticSummary?.today.completed).toBe(1);

      await act(async () => {
        rejectMutation(new AppError('INTERNAL', 'Server error', 500));
      });

      const rolledBackList =
        queryClient.getQueryData<InfiniteData<TaskListPage>>(listKey);
      const rolledBackSummary = queryClient.getQueryData<TaskSummary>(summaryKey);

      expect(rolledBackList?.pages[0]?.tasks[0]?.completed).toBe(false);
      expect(rolledBackSummary?.today.completed).toBe(0);
    } finally {
      await act(async () => {
        renderer?.unmount();
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
      spy.mockRestore();
      queryClient.clear();
    }
  });
});
