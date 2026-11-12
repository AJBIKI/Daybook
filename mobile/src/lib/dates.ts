import {
  addDays,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isPast,
  isToday,
  isTomorrow,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfDay,
} from 'date-fns';

export type QuickDuePreset = 'today' | 'tomorrow' | 'nextWeek';

export function getTodayBoundaries(): { dueFrom: string; dueTo: string } {
  const now = new Date();
  return {
    dueFrom: startOfDay(now).toISOString(),
    dueTo: endOfDay(now).toISOString(),
  };
}

export function getOverdueUpperBound(): string {
  const start = startOfDay(new Date());
  return new Date(start.getTime() - 1).toISOString();
}

export function getUpcomingLowerBound(): string {
  const end = endOfDay(new Date());
  return new Date(end.getTime() + 1).toISOString();
}

export function formatTodayHeader(): {
  weekdayEyebrow: string;
  dateTitle: string;
} {
  const now = new Date();
  return {
    weekdayEyebrow: format(now, 'EEEE').toUpperCase(),
    dateTitle: format(now, 'MMMM d'),
  };
}

export function isTaskOverdue(
  dueDateIso: string | null,
  completed: boolean,
): boolean {
  if (!dueDateIso || completed) {
    return false;
  }
  return isPast(new Date(dueDateIso));
}

export function isDueToday(dueDateIso: string | null): boolean {
  if (!dueDateIso) {
    return false;
  }
  return isToday(new Date(dueDateIso));
}

export function isDueBeforeToday(dueDateIso: string | null): boolean {
  if (!dueDateIso) {
    return false;
  }
  return isBefore(new Date(dueDateIso), startOfDay(new Date()));
}

export function isDueAfterToday(dueDateIso: string | null): boolean {
  if (!dueDateIso) {
    return false;
  }
  return isAfter(new Date(dueDateIso), endOfDay(new Date()));
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

export function buildQuickDueDate(preset: QuickDuePreset): Date {
  const now = new Date();
  if (preset === 'today') {
    const fivePm = setMilliseconds(setSeconds(setMinutes(setHours(now, 17), 0), 0), 0);
    if (isAfter(fivePm, now)) {
      return fivePm;
    }
    const ninePm = setMilliseconds(setSeconds(setMinutes(setHours(now, 21), 0), 0), 0);
    if (isAfter(ninePm, now)) {
      return ninePm;
    }
    return setMilliseconds(setSeconds(setMinutes(setHours(now, 23), 59), 0), 0);
  }

  const targetDay = addDays(now, preset === 'tomorrow' ? 1 : 7);
  return setMilliseconds(setSeconds(setMinutes(setHours(targetDay, 9), 0), 0), 0);
}

export function mergeDatePart(base: Date | null, pickedDate: Date): Date {
  const template = base ?? buildQuickDueDate('today');
  const next = new Date(pickedDate);
  next.setHours(
    template.getHours(),
    template.getMinutes(),
    0,
    0,
  );
  return next;
}

export function mergeTimePart(base: Date | null, pickedTime: Date): Date {
  const next = new Date(base ?? new Date());
  next.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
  return next;
}
