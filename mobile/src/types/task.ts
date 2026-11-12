export type TaskPriority = 1 | 2 | 3;

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes: string;
  priority: TaskPriority;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  today: {
    total: number;
    completed: number;
  };
  overdue: number;
  upcoming: number;
}

export type TaskStatusFilter = 'all' | 'active' | 'completed';
export type TaskSortBy = 'createdAt' | 'dueDate' | 'priority';
export type SortOrder = 'asc' | 'desc';

export interface TaskListFilters {
  status?: TaskStatusFilter;
  priority?: TaskPriority;
  dueFrom?: string;
  dueTo?: string;
  q?: string;
  sortBy?: TaskSortBy;
  order?: SortOrder;
  limit?: number;
}
