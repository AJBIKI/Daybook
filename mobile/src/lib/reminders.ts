import notifee, {
  AndroidImportance,
  type TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Task } from '../types/task';

export const REMINDERS_CHANNEL_ID = 'daybook-reminders';
export const REMINDERS_STORAGE_KEY = 'daybook.reminders.enabled';

/**
 * Creates or verifies the high-importance notification channel on Android.
 */
export async function ensureNotificationChannel(): Promise<void> {
  try {
    await notifee.createChannel({
      id: REMINDERS_CHANNEL_ID,
      name: 'Task Reminders',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  } catch {
    // Channel creation errors are safely ignored on non-Android or unsupported environments.
  }
}

/**
 * Requests notification permissions from the OS (Android 13+ / iOS).
 * Returns true if authorized.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  } catch {
    return false;
  }
}

/**
 * Checks if notification permissions have already been granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= 1;
  } catch {
    return false;
  }
}

/**
 * Checks if a task has local reminders enabled.
 */
export async function getReminderEnabled(taskId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const map = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(map[taskId]);
  } catch {
    return false;
  }
}

/**
 * Sets whether a task has local reminders enabled in local storage.
 */
export async function setReminderEnabled(
  taskId: string,
  enabled: boolean,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    if (enabled) {
      map[taskId] = true;
    } else {
      delete map[taskId];
    }
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Persistent storage failure fallback
  }
}

/**
 * Schedules a local timestamp-trigger reminder for a task at its dueDate.
 * If the due date is in the past or missing, cancels any active reminder.
 */
export async function scheduleTaskReminder(task: {
  id: string;
  title: string;
  notes?: string;
  dueDate: string | Date | null;
}): Promise<boolean> {
  if (!task.dueDate) {
    await cancelTaskReminder(task.id);
    return false;
  }

  const dueTime = new Date(task.dueDate).getTime();
  if (Number.isNaN(dueTime) || dueTime <= Date.now()) {
    await cancelTaskReminder(task.id);
    return false;
  }

  await ensureNotificationChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: dueTime,
  };

  try {
    await notifee.createTriggerNotification(
      {
        id: task.id,
        title: task.title,
        body: task.notes && task.notes.trim() ? task.notes.slice(0, 120) : 'Task reminder is due now.',
        android: {
          channelId: REMINDERS_CHANNEL_ID,
          pressAction: {
            id: 'default',
          },
        },
      },
      trigger,
    );

    await setReminderEnabled(task.id, true);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancels any scheduled notification and trigger for the specified task.
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelNotification(taskId);
    await notifee.cancelTriggerNotification(taskId);
  } catch {
    // Ignored if notification does not exist
  }
  await setReminderEnabled(taskId, false);
}

/**
 * Re-synchronizes scheduled reminders against active tasks on app start.
 * Cancels reminders for deleted, completed, or past-due tasks.
 */
export async function syncReminders(activeTasks: Task[]): Promise<void> {
  try {
    await ensureNotificationChannel();
    const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const map = JSON.parse(raw) as Record<string, boolean>;
    const taskMap = new Map<string, Task>();
    for (const t of activeTasks) {
      taskMap.set(t.id, t);
    }

    const scheduledIds = Object.keys(map);
    await Promise.all(
      scheduledIds.map(async (taskId) => {
        const task = taskMap.get(taskId);
        if (!task || task.completed || !task.dueDate) {
          await cancelTaskReminder(taskId);
        } else {
          const dueTime = new Date(task.dueDate).getTime();
          if (dueTime <= Date.now()) {
            await cancelTaskReminder(taskId);
          } else {
            await scheduleTaskReminder(task);
          }
        }
      }),
    );
  } catch {
    // Synchronization error fallback
  }
}
