import type { Task } from '../types/task';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabsParamList = {
  Today: undefined;
  Tasks: { preset?: 'overdue' | 'upcoming'; nonce?: number } | undefined;
  Settings: undefined;
};

export type AuthenticatedStackParamList = {
  AppTabs: undefined;
  TaskModal:
    | {
        taskId?: string;
        initialTask?: Task;
        defaultDuePreset?: 'today';
      }
    | undefined;
};
