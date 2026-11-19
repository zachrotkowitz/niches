import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { parseDay, type Plan } from '@/lib/plans';

/**
 * Your own reminder for a plan (founder, Nov 19 2026): you choose when it
 * comes. Stored as minutes before the plan; MORNING_OF means 9 AM that day.
 * Only you get it; the host's choice doesn't change anyone else's.
 */
export const MORNING_OF = -1;
export const REMINDER_CHOICES: { minutes: number; label: string; needsTime?: boolean }[] = [
  { minutes: 0, label: 'When it starts', needsTime: true },
  { minutes: 60, label: '1 hour before', needsTime: true },
  { minutes: 180, label: '3 hours before', needsTime: true },
  { minutes: MORNING_OF, label: 'Morning of (9 AM)' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 2880, label: '2 days before' },
  { minutes: 10080, label: '1 week before' },
];

export const reminderLabel = (minutes: number) => REMINDER_CHOICES.find((c) => c.minutes === minutes)?.label ?? 'Set';

/** When the plan starts. Without a time, a plan counts as noon so "1 day before" still makes sense. */
export function planStart(plan: Plan): Date {
  const d = parseDay(plan.date);
  const m = plan.time?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    const h = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
    d.setHours(h, Number(m[2]), 0, 0);
  } else d.setHours(12, 0, 0, 0);
  return d;
}

export function reminderDate(plan: Plan, minutes: number): Date {
  if (minutes === MORNING_OF) {
    const d = parseDay(plan.date);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  return new Date(planStart(plan).getTime() - minutes * 60_000);
}

if (Platform.OS !== 'web') {
  // Show the reminder even if Niches is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export type ScheduleResult = { ok: true; notificationId?: string } | { ok: false; reason: 'past' | 'denied' };

/** Ask the phone to show a reminder. On the web it only remembers your choice. */
export async function scheduleReminder(plan: Plan, minutes: number): Promise<ScheduleResult> {
  const when = reminderDate(plan, minutes);
  if (when.getTime() <= Date.now()) return { ok: false, reason: 'past' };
  if (Platform.OS === 'web') return { ok: true };
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    const asked = await Notifications.requestPermissionsAsync();
    if (!asked.granted) return { ok: false, reason: 'denied' };
  }
  const time = plan.time ? ` at ${plan.time}` : '';
  const body =
    minutes === 0 ? `Starting now${plan.location ? ` · ${plan.location}` : ''}` : minutes >= 1440 ? `Coming up ${minutes === 1440 ? 'tomorrow' : `in ${Math.round(minutes / 1440)} days`}${time}` : `Today${time}${plan.location ? ` · ${plan.location}` : ''}`;
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: plan.title, body, data: { url: `/plans/${plan.id}` } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
  return { ok: true, notificationId };
}

export async function cancelReminder(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already shown or gone.
  }
}

/** Tapping a reminder opens its plan. Used once in the root layout. */
export function listenForReminderTaps(open: (url: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  });
  return () => sub.remove();
}
