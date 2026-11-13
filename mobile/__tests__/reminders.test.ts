import notifee, {
  AndroidImportance,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  REMINDERS_CHANNEL_ID,
  REMINDERS_STORAGE_KEY,
  cancelTaskReminder,
  ensureNotificationChannel,
  getReminderEnabled,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleTaskReminder,
  setReminderEnabled,
  syncReminders,
} from '../src/lib/reminders';
import type { Task } from '../src/types/task';

describe('Reminders service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ensures notification channel with HIGH importance', async () => {
    await ensureNotificationChannel();
    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: REMINDERS_CHANNEL_ID,
        name: 'Task Reminders',
        importance: AndroidImportance.HIGH,
      }),
    );
  });

  it('checks and requests notification permissions', async () => {
    const hasPerm = await hasNotificationPermission();
    expect(hasPerm).toBe(true);

    const requested = await requestNotificationPermission();
    expect(requested).toBe(true);
  });

  it('tracks reminder state in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ task1: true }),
    );
    const enabled = await getReminderEnabled('task1');
    expect(enabled).toBe(true);

    await setReminderEnabled('task1', false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      REMINDERS_STORAGE_KEY,
      JSON.stringify({}),
    );
  });

  it('schedules a trigger notification for future due date', async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
    const task = {
      id: 'task-future-1',
      title: 'Review PR',
      notes: 'Important architectural changes',
      dueDate: futureDate,
    };

    const scheduled = await scheduleTaskReminder(task);
    expect(scheduled).toBe(true);
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-future-1',
        title: 'Review PR',
        android: expect.objectContaining({
          channelId: REMINDERS_CHANNEL_ID,
        }),
      }),
      expect.objectContaining({
        type: TriggerType.TIMESTAMP,
      }),
    );
  });

  it('cancels reminder and skips scheduling when due date is in the past', async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const task = {
      id: 'task-past-1',
      title: 'Overdue task',
      dueDate: pastDate,
    };

    const scheduled = await scheduleTaskReminder(task);
    expect(scheduled).toBe(false);
    expect(notifee.cancelNotification).toHaveBeenCalledWith('task-past-1');
  });

  it('cancels reminder on request', async () => {
    await cancelTaskReminder('task-del-1');
    expect(notifee.cancelNotification).toHaveBeenCalledWith('task-del-1');
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('task-del-1');
  });

  it('syncReminders cancels completed or missing tasks and retains active ones', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        'task-completed': true,
        'task-active': true,
      }),
    );

    const activeTasks: Task[] = [
      {
        id: 'task-active',
        userId: 'u1',
        title: 'Still active task',
        notes: '',
        priority: 2,
        dueDate: new Date(Date.now() + 100000).toISOString(),
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-completed',
        userId: 'u1',
        title: 'Done task',
        notes: '',
        priority: 2,
        dueDate: new Date(Date.now() + 100000).toISOString(),
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await syncReminders(activeTasks);

    // Completed task reminder cancelled
    expect(notifee.cancelNotification).toHaveBeenCalledWith('task-completed');
    // Active task scheduled
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-active' }),
      expect.anything(),
    );
  });
});
