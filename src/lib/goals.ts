// Goals: the Strava-style loop that makes Niches useful on your own.
// Research-backed defaults (docs/research, "Progress and goals"):
// - streaks are weekly, never daily, and private to you
// - rest weeks keep a streak alive (rest is part of training)
// - no weight or body goals; Gym goals track what you can do, not what you weigh
// - goals are private by default; on your profile you can still hide the numbers

import { isoDay, parseDay } from './plans';
import type { NicheId } from './theme';

/**
 * habit: do it N times a week (weekly streak).
 * total: reach a count, like "Bake 20 loaves".
 * best:  a personal best, like "Squat 100 kg" or "5K in 25 min".
 */
export type GoalKind = 'habit' | 'total' | 'best';
export type GoalVisibility = 'private' | 'profile';

export type CheckIn = {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** best: the number you hit. total: how many this adds (defaults to 1). */
  value?: number;
  note?: string;
  /** Diary entry this check-in came from. */
  logId?: string;
  /** Progress post this check-in came from. */
  postId?: string;
  createdAt: number;
};

export type Goal = {
  id: string;
  userId: string;
  niche: NicheId;
  kind: GoalKind;
  title: string;
  /** habit: times per week, 1–7. */
  perWeek?: number;
  /** total and best: the number to reach. */
  target?: number;
  /** total: "loaves"; best: "kg", "reps", "min". */
  unit?: string;
  /** best: whether higher is better (lifts, reps) or lower (run times). */
  direction?: 'up' | 'down';
  /** best: where you started. */
  start?: number;
  visibility: GoalVisibility;
  /** On your profile: show the goal and its progress bar, but not the numbers. */
  hideNumbers?: boolean;
  /** Weeks you took off, as week keys (the Monday). */
  restWeeks: string[];
  checkIns: CheckIn[];
  doneAt?: number;
  createdAt: number;
  /** Demo sample data, removable in one tap. */
  sample?: boolean;
};

export type GoalTemplate = Pick<Goal, 'kind' | 'title' | 'perWeek' | 'target' | 'unit' | 'direction' | 'start'>;

/** Starting points per niche. Gym is performance and habit only, never weight. */
export const GOAL_TEMPLATES: Record<NicheId, GoalTemplate[]> = {
  cooking: [
    { kind: 'habit', title: 'Cook at home 3× a week', perWeek: 3 },
    { kind: 'habit', title: 'Make fresh pasta every week', perWeek: 1 },
    { kind: 'total', title: 'Bake 20 loaves', target: 20, unit: 'loaves' },
    { kind: 'total', title: 'Try 12 new cuisines', target: 12, unit: 'cuisines' },
  ],
  art: [
    { kind: 'habit', title: 'Sketch 3× a week', perWeek: 3 },
    { kind: 'total', title: 'Finish 10 paintings', target: 10, unit: 'paintings' },
    { kind: 'total', title: 'Fill a sketchbook', target: 60, unit: 'pages' },
  ],
  photography: [
    { kind: 'habit', title: 'Go shooting every week', perWeek: 1 },
    { kind: 'total', title: 'Shoot 12 rolls of film', target: 12, unit: 'rolls' },
    { kind: 'total', title: '52 photos in 52 weeks', target: 52, unit: 'photos' },
  ],
  gym: [
    { kind: 'habit', title: 'Train 3× a week', perWeek: 3 },
    { kind: 'best', title: 'Squat 100 kg', target: 100, start: 60, unit: 'kg', direction: 'up' },
    { kind: 'best', title: '10 pull-ups in a row', target: 10, start: 3, unit: 'reps', direction: 'up' },
    { kind: 'best', title: 'Run 5K in under 25 min', target: 25, start: 31, unit: 'min', direction: 'down' },
  ],
};

export const BEST_UNITS = ['kg', 'lb', 'reps', 'min', 'sec', 'km', 'mi', '%'];

// ——— Weeks ———

/** The Monday of the week a date falls in, as YYYY-MM-DD. */
export function weekKey(iso: string): string {
  const d = parseDay(iso);
  const back = (d.getDay() + 6) % 7; // Monday = 0
  return isoDay(-back, d);
}

export function addWeeks(key: string, n: number): string {
  return isoDay(n * 7, parseDay(key));
}

/** Whole weeks from a to b (both week keys). */
export function weeksBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / (7 * 86400000));
}

const startWeek = (g: Goal) => weekKey(isoDay(0, new Date(g.createdAt)));

export function checkInsByWeek(g: Goal): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of g.checkIns) {
    const k = weekKey(c.date);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export type WeekCell = { key: string; count: number; met: boolean; rest: boolean; current: boolean; beforeStart: boolean };

/** The last `n` weeks, oldest first, for the week strip. */
export function weekStrip(g: Goal, n = 12, today = isoDay()): WeekCell[] {
  const byWeek = checkInsByWeek(g);
  const now = weekKey(today);
  const first = startWeek(g);
  const per = g.kind === 'habit' ? g.perWeek ?? 1 : 1;
  return Array.from({ length: n }, (_, i) => {
    const key = addWeeks(now, i - (n - 1));
    const count = byWeek[key] ?? 0;
    return { key, count, met: count >= per, rest: g.restWeeks.includes(key), current: key === now, beforeStart: key < first && count === 0 };
  });
}

/**
 * Weekly streak: weeks in a row where you hit your number. Rest weeks don't
 * break it (and don't add to it). This week only counts once you've hit it,
 * so an unfinished week never "breaks" anything.
 */
export function streak(g: Goal, today = isoDay()): number {
  const byWeek = checkInsByWeek(g);
  const per = g.kind === 'habit' ? g.perWeek ?? 1 : 1;
  const first = startWeek(g);
  // Check-ins can be backdated to before the goal was made.
  const floor = Object.keys(byWeek).reduce((a, b) => (b < a ? b : a), first);
  let key = weekKey(today);
  let n = 0;
  if ((byWeek[key] ?? 0) >= per) n++;
  key = addWeeks(key, -1);
  // Walk back through finished weeks. Stop at the first missed, non-rest week.
  for (let guard = 0; guard < 520 && key >= floor; guard++) {
    if ((byWeek[key] ?? 0) >= per) n++;
    else if (!g.restWeeks.includes(key)) break;
    key = addWeeks(key, -1);
  }
  return n;
}

/** Longest weekly streak ever, for the recap. */
export function longestStreak(g: Goal): number {
  const byWeek = checkInsByWeek(g);
  const per = g.kind === 'habit' ? g.perWeek ?? 1 : 1;
  const keys = Object.keys(byWeek).sort();
  if (!keys.length) return 0;
  let best = 0;
  let run = 0;
  for (let key = keys[0]; key <= keys[keys.length - 1]; key = addWeeks(key, 1)) {
    if ((byWeek[key] ?? 0) >= per) best = Math.max(best, ++run);
    else if (!g.restWeeks.includes(key)) run = 0;
  }
  return best;
}

export type Progress = {
  /** 0–1, for the progress bar. */
  fraction: number;
  /** The big number, e.g. "2 of 3", "14 / 20", "85 kg". */
  headline: string;
  /** Under the big number, e.g. "this week", "loaves". */
  caption: string;
  reached: boolean;
};

export function progress(g: Goal, today = isoDay()): Progress {
  if (g.kind === 'habit') {
    const per = g.perWeek ?? 1;
    const count = checkInsByWeek(g)[weekKey(today)] ?? 0;
    const rest = g.restWeeks.includes(weekKey(today));
    return {
      fraction: rest ? 1 : Math.min(1, count / per),
      headline: rest ? 'Rest week' : `${Math.min(count, 99)} of ${per}`,
      caption: rest ? 'your streak is safe' : 'this week',
      reached: false,
    };
  }
  if (g.kind === 'total') {
    const total = g.checkIns.reduce((n, c) => n + (c.value ?? 1), 0);
    const target = g.target ?? 1;
    return { fraction: Math.min(1, total / target), headline: `${total} / ${target}`, caption: g.unit ?? 'done', reached: total >= target };
  }
  const current = currentBest(g);
  const start = g.start ?? current ?? 0;
  const target = g.target ?? 0;
  const span = target - start;
  const fraction = current === undefined || span === 0 ? 0 : Math.max(0, Math.min(1, (current - start) / span));
  const reached = current !== undefined && (g.direction === 'down' ? current <= target : current >= target);
  return {
    fraction,
    headline: `${fmt(current ?? start)} ${g.unit ?? ''}`.trim(),
    caption: current === undefined ? `starting point · goal ${fmt(target)}` : `best so far · goal ${fmt(target)}`,
    reached,
  };
}

/** Your best value so far on a personal-best goal. */
export function currentBest(g: Goal): number | undefined {
  const values = g.checkIns.map((c) => c.value).filter((v): v is number => typeof v === 'number');
  if (!values.length) return undefined;
  return g.direction === 'down' ? Math.min(...values) : Math.max(...values);
}

export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** One line describing the goal's rule, e.g. "3× a week" or "Personal best · higher is better". */
export function goalRule(g: Pick<Goal, 'kind' | 'perWeek' | 'target' | 'unit' | 'direction'>): string {
  if (g.kind === 'habit') return g.perWeek === 1 ? 'Once a week' : `${g.perWeek ?? 1}× a week`;
  if (g.kind === 'total') return `Reach ${g.target ?? 0} ${g.unit ?? ''}`.trim();
  return `Personal best · ${g.direction === 'down' ? 'lower' : 'higher'} is better`;
}

/** "Week 4" since the goal started, used to label progress posts without exposing numbers. */
export function weekNumber(g: Goal, today = isoDay()): number {
  return Math.max(1, weeksBetween(startWeek(g), weekKey(today)) + 1);
}

/** Goals a viewer can see on someone's profile. */
export function visibleGoals(goals: Goal[], userId: string, viewerId: string | undefined): Goal[] {
  return goals.filter((g) => g.userId === userId && (userId === viewerId || g.visibility === 'profile'));
}

// ——— Seed ———

/** A public goal for a demo account, so profiles show what goals look like. */
export function seedGoals(now: number): Goal[] {
  const day = (back: number) => isoDay(-back, new Date(now));
  const ci = (id: string, back: number, extra: Partial<CheckIn> = {}): CheckIn => ({ id, date: day(back), createdAt: now - back * 86400000, ...extra });
  return [
    {
      id: 'goal_maya_pasta',
      userId: 'u_maya',
      niche: 'cooking',
      kind: 'habit',
      title: 'Make fresh pasta every week',
      perWeek: 1,
      visibility: 'profile',
      restWeeks: [],
      checkIns: [ci('ci_m1', 15), ci('ci_m2', 8), ci('ci_m3', 0, { postId: 'p_tagliatelle', logId: 'log_maya_2' })],
      createdAt: now - 16 * 86400000,
    },
    {
      id: 'goal_dev_loaves',
      userId: 'u_dev',
      niche: 'cooking',
      kind: 'total',
      title: 'Bake 20 loaves',
      target: 20,
      unit: 'loaves',
      visibility: 'profile',
      restWeeks: [],
      checkIns: Array.from({ length: 14 }, (_, i) => ci(`ci_d${i}`, i * 5, i === 0 ? { logId: 'log_dev_1', postId: 'p_sourdough' } : {})),
      createdAt: now - 70 * 86400000,
    },
  ];
}
