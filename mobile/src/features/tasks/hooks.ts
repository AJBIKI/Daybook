import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useToast } from '../../components/ui/Toast';
import {
  isDueAfterToday,
  isDueBeforeToday,
  isDueToday,
} from '../../lib/dates';
import { triggerLightHaptic } from '../../lib/haptics';
import {
  cancelTaskReminder,
  getReminderEnabled,
  scheduleTaskReminder,
} from '../../lib/reminders';
import { AppError } from '../../types/api';
import type { Task, TaskListFilters, TaskSummary } from '../../types/task';
import {
  type CreateTaskInput,
  type TaskListPage,
  type UpdateTaskInput,
  createTaskRequest,
  deleteTaskRequest,
  getTaskRequest,
  getTaskSummaryRequest,
  listTasksRequest,
  updateTaskRequest,
} from './api';
import { taskKeys } from './queryKeys';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useTaskSummaryQuery(boundaries: {
  dueFrom: string;
  dueTo: string;
}) {
  return useQuery({
    queryKey: taskKeys.summary(boundaries),
    queryFn: () =>
      getTaskSummaryRequest(boundaries.dueFrom, boundaries.dueTo),
  });
}

export function useInfiniteTasksQuery(filters: TaskListFilters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listTasksRequest(filters, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useTaskDetailQuery(
  taskId: string | undefined,
  initialTask?: Task,
) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ''),
    queryFn: () => getTaskRequest(taskId as string),
    enabled: Boolean(taskId),
    initialData: initialTask,
  });
}

interface ToggleContext {
  previousLists: Array<[QueryKey, InfiniteData<TaskListPage> | undefined]>;
  previousSummaries: Array<[QueryKey, TaskSummary | undefined]>;
  previousDetail: Task | undefined;
}

function patchInfiniteListPages(
  data: InfiniteData<TaskListPage> | undefined,
  targetId: string,
  nextCompleted: boolean,
  nextCompletedAt: string | null,
): InfiniteData<TaskListPage> | undefined {
  if (!data) {
    return data;
  }
  let changed = false;
  const pages = data.pages.map((page) => {
    const hasMatch = page.tasks.some((item) => item.id === targetId);
    if (!hasMatch) {
      return page;
    }
    changed = true;
    return {
      ...page,
      tasks: page.tasks.map((item) =>
        item.id === targetId
          ? {
              ...item,
              completed: nextCompleted,
              completedAt: nextCompletedAt,
            }
          : item,
      ),
    };
  });

  return changed ? { ...data, pages } : data;
}

function patchSummaryCounts(
  summary: TaskSummary | undefined,
  task: Task,
  nextCompleted: boolean,
): TaskSummary | undefined {
  if (!summary || task.completed === nextCompleted) {
    return summary;
  }

  const deltaCompleted = nextCompleted ? 1 : -1;
  const next = {
    today: { ...summary.today },
    overdue: summary.overdue,
    upcoming: summary.upcoming,
  };

  if (isDueToday(task.dueDate)) {
    next.today.completed = Math.max(0, next.today.completed + deltaCompleted);
  } else if (isDueBeforeToday(task.dueDate)) {
    next.overdue = Math.max(0, next.overdue - deltaCompleted);
  } else if (isDueAfterToday(task.dueDate)) {
    next.upcoming = Math.max(0, next.upcoming - deltaCompleted);
  }

  return next;
}

export function useToggleTaskMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<Task, unknown, Task, ToggleContext>({
    mutationFn: (task) =>
      updateTaskRequest(task.id, { completed: !task.completed }),

    onMutate: async (task) => {
      triggerLightHaptic();
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousLists = queryClient.getQueriesData<
        InfiniteData<TaskListPage>
      >({
        queryKey: taskKeys.lists(),
      });
      const previousSummaries = queryClient.getQueriesData<TaskSummary>({
        queryKey: taskKeys.summaries(),
      });
      const previousDetail = queryClient.getQueryData<Task>(
        taskKeys.detail(task.id),
      );

      const nextCompleted = !task.completed;
      const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;

      if (nextCompleted) {
        cancelTaskReminder(task.id).catch(() => {});
      } else {
        getReminderEnabled(task.id)
          .then((enabled) => {
            if (enabled && task.dueDate) {
              scheduleTaskReminder(task).catch(() => {});
            }
          })
          .catch(() => {});
      }

      for (const [key, data] of previousLists) {
        const patched = patchInfiniteListPages(
          data,
          task.id,
          nextCompleted,
          nextCompletedAt,
        );
        if (patched !== data) {
          queryClient.setQueryData(key, patched);
        }
      }

      for (const [key, summary] of previousSummaries) {
        const patched = patchSummaryCounts(summary, task, nextCompleted);
        if (patched !== summary) {
          queryClient.setQueryData(key, patched);
        }
      }

      if (previousDetail) {
        queryClient.setQueryData<Task>(taskKeys.detail(task.id), {
          ...previousDetail,
          completed: nextCompleted,
          completedAt: nextCompletedAt,
        });
      }

      return { previousLists, previousSummaries, previousDetail };
    },

    onError: (error, task, context) => {
      if (context) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
        for (const [key, summary] of context.previousSummaries) {
          queryClient.setQueryData(key, summary);
        }
        if (context.previousDetail !== undefined) {
          queryClient.setQueryData(
            taskKeys.detail(task.id),
            context.previousDetail,
          );
        }
      }
      showToast(
        getErrorMessage(error, 'Could not update task. Changes reverted.'),
        'error',
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all }).catch(() => {});
    },
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTaskRequest(input),
    onSuccess: () => {
      triggerLightHaptic();
      showToast('Task added', 'success');
    },
    onError: (error) => {
      showToast(getErrorMessage(error, 'Could not create task.'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all }).catch(() => {});
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTaskRequest(id, input),
    onSuccess: (updated) => {
      triggerLightHaptic();
      queryClient.setQueryData(taskKeys.detail(updated.id), updated);
      showToast('Changes saved', 'success');
    },
    onError: (error) => {
      showToast(getErrorMessage(error, 'Could not save changes.'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all }).catch(() => {});
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTaskRequest(id),
    onSuccess: ({ id }) => {
      cancelTaskReminder(id).catch(() => {});
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      showToast('Task deleted', 'info');
    },
    onError: (error) => {
      showToast(getErrorMessage(error, 'Could not delete task.'), 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all }).catch(() => {});
    },
  });
}
