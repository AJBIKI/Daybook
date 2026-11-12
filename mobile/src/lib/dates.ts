import { endOfDay, format, isPast, isToday, isTomorrow, startOfDay } from 'date-fns';

export function getTodayBoundaries(): { dueFrom: string; dueTo: string } {
  const now = new Date();
  return {
    dueFrom: startOfDay(now).toISOString(),
    dueTo: endOfDay(now).toISOString(),
  };
}

export function isTaskOverdue(dueDateIso: string | null, completed: boolean): boolean {
  if (!dueDateIso || completed) {
    return false;
  }
  return isPast(new Date(dueDateIso));
}

export function formatDueLabel(dueDateIso: string | null): string | null {
  if (!dueDateIso) {
    return null;
  }
  const date = new Date(dueDateIso);
  const timePart = format(date, 'h:mm a');
  if (isToday(date)) {
    return `Today, ${timePart}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${timePart}`;
  }
  return `${format(date, 'EEE, MMM d')} · ${timePart}`;
}
