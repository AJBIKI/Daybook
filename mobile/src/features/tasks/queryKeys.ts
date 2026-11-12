import type { TaskListFilters } from '../../types/task';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskListFilters) => [...taskKeys.lists(), filters] as const,
  summaries: () => [...taskKeys.all, 'summary'] as const,
  summary: (boundaries: { dueFrom: string; dueTo: string }) =>
    [...taskKeys.summaries(), boundaries] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};
