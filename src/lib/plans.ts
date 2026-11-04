// Plans: meal scheduling, cooking together, and outings (shoots, art sessions,
// workouts). Demo data lives on the device like everything else.

import type { NicheId } from './theme';

export type PlanKind = 'meal' | 'together' | 'outing';
export type Visibility = 'private' | 'public';
export type Rsvp = 'going' | 'maybe' | 'no';

export type PlanItem = { id: string; name: string; claimedBy?: string };
export type DishIdea = { id: string; name: string; by: string; votes: string[] };

export type Plan = {
  id: string;
  ownerId: string;
  niche: NicheId;
  kind: PlanKind;
  title: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Display time like "7:00 PM", or a meal like "Dinner". */
  time?: string;
  location?: string;
  notes?: string;
  visibility: Visibility;
  /** People asked to join (not including the owner). */
  invitees: string[];
  rsvps: Record<string, Rsvp>;
  /** Cook together: dish suggestions people vote on. */
  dishIdeas: DishIdea[];
  chosenDishId?: string;
  /** Cook together: ingredients to claim. Outings: things to bring or a shot list. */
  items: PlanItem[];
  createdAt: number;
};

/** What each kind is called, per niche. */
export function kindLabel(kind: PlanKind, niche: NicheId): string {
  if (kind === 'meal') return 'Meal';
  if (kind === 'together') return 'Cook together';
  return niche === 'photography' ? 'Shoot' : niche === 'art' ? 'Art session' : niche === 'gym' ? 'Workout' : 'Outing';
}

/** Which plan kinds make sense in a niche. */
export function kindsFor(niche: NicheId): PlanKind[] {
  return niche === 'cooking' ? ['meal', 'together', 'outing'] : ['outing'];
}

export const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const CLOCK_TIMES = ['9:00 AM', '10:00 AM', '12:00 PM', '3:00 PM', '5:30 PM', '7:00 PM', '8:00 PM'];

// ——— Dates ———

const pad = (n: number) => String(n).padStart(2, '0');

export function isoDay(offsetDays = 0, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Today", "Tomorrow", "Thu, Nov 7". */
export function dayLabel(iso: string, today = isoDay()): string {
  if (iso === today) return 'Today';
  if (iso === isoDay(1)) return 'Tomorrow';
  if (iso === isoDay(-1)) return 'Yesterday';
  return parseDay(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function weekdayShort(iso: string): string {
  return parseDay(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

export function dayOfMonth(iso: string): string {
  return String(parseDay(iso).getDate());
}

export function monthShort(iso: string): string {
  return parseDay(iso).toLocaleDateString(undefined, { month: 'short' });
}

// ——— Seed ———

let counter = 0;
const id = (p: string) => `${p}${++counter}`;

export function seedPlans(now: number, meId = 'u_me'): Plan[] {
  const today = new Date(now);
  return [
    {
      id: 'plan_pasta_night',
      ownerId: 'u_maya',
      niche: 'cooking',
      kind: 'together',
      title: 'Fresh pasta night',
      date: isoDay(3, today),
      time: '7:00 PM',
      location: 'Maya’s place',
      notes: 'I’ll make the dough. Pick a sauce and bring something from the list!',
      visibility: 'private',
      invitees: [meId, 'u_dev', 'u_lu', 'u_sam'],
      rsvps: { u_dev: 'going', u_lu: 'maybe' },
      dishIdeas: [
        { id: 'd1', name: 'Cacio e pepe', by: 'u_maya', votes: ['u_maya', 'u_dev'] },
        { id: 'd2', name: 'Tagliatelle al ragù', by: 'u_lu', votes: ['u_lu'] },
        { id: 'd3', name: 'Lemon ricotta ravioli', by: 'u_dev', votes: [] },
      ],
      items: [
        { id: id('i'), name: '00 flour', claimedBy: 'u_maya' },
        { id: id('i'), name: 'A dozen eggs', claimedBy: 'u_maya' },
        { id: id('i'), name: 'Pecorino Romano', claimedBy: 'u_dev' },
        { id: id('i'), name: 'Black peppercorns' },
        { id: id('i'), name: 'Guanciale' },
        { id: id('i'), name: 'Wine', claimedBy: 'u_lu' },
        { id: id('i'), name: 'A green salad' },
        { id: id('i'), name: 'Something for dessert' },
      ],
      createdAt: now - 26 * 3600 * 1000,
    },
    {
      id: 'plan_golden_walk',
      ownerId: 'u_nadia',
      niche: 'photography',
      kind: 'outing',
      title: 'Golden hour photo walk',
      date: isoDay(5, today),
      time: '5:30 PM',
      location: 'Waterfront path, north end',
      notes: 'Bring any camera, phones welcome. We’ll walk about two miles and finish at the pier for sunset.',
      visibility: 'public',
      invitees: [],
      rsvps: { u_omar: 'going', u_priya: 'going' },
      dishIdeas: [],
      items: [
        { id: id('i'), name: 'A wide shot of the bridge' },
        { id: id('i'), name: 'One portrait of a stranger (ask first)' },
        { id: id('i'), name: 'Something reflected in water' },
      ],
      createdAt: now - 3 * 24 * 3600 * 1000,
    },
    {
      id: 'plan_sketch_crawl',
      ownerId: 'u_rosa',
      niche: 'art',
      kind: 'outing',
      title: 'Sketch crawl at the farmers market',
      date: isoDay(6, today),
      time: '10:00 AM',
      location: 'Saturday farmers market, main entrance',
      notes: 'Three stops, 30 minutes each, then coffee and a sketchbook swap.',
      visibility: 'public',
      invitees: [],
      rsvps: { u_kenji: 'going', u_maya: 'maybe' },
      dishIdeas: [],
      items: [
        { id: id('i'), name: 'Sketchbook' },
        { id: id('i'), name: 'A pen you can’t erase' },
        { id: id('i'), name: 'Small watercolor kit (optional)' },
      ],
      createdAt: now - 2 * 24 * 3600 * 1000,
    },
  ];
}

/** People taking part: the owner plus invitees and anyone who said they're going or maybe. */
export function participants(plan: Plan): string[] {
  const ids = new Set<string>([plan.ownerId, ...plan.invitees]);
  for (const [uid, r] of Object.entries(plan.rsvps)) if (r !== 'no') ids.add(uid);
  return [...ids];
}

/** Whether a viewer can see a plan. */
export function canSee(plan: Plan, viewerId: string | undefined): boolean {
  if (plan.visibility === 'public') return true;
  return !!viewerId && (plan.ownerId === viewerId || plan.invitees.includes(viewerId));
}

export function chosenDish(plan: Plan): DishIdea | undefined {
  return plan.dishIdeas.find((d) => d.id === plan.chosenDishId);
}
