// "Your year in Cooking": a Wrapped-style look back built from your own diary,
// goals and posts. It's private: no likes, no follower numbers, nothing about
// how you compare to anyone. You choose whether to share it.

import { MAX_FAVORITES, type FavoriteRef, type LogEntry } from './diary';
import { longestStreak, weekKey, type CheckIn, type Goal } from './goals';
import { isoDay, parseDay } from './plans';
import type { NicheId } from './theme';
import type { Post } from './types';

export type Recap = {
  year: number;
  /** True while the year is still going ("so far"). */
  ongoing: boolean;
  total: number;
  distinct: number;
  byMonth: number[];
  busiestMonth: number;
  weeksActive: number;
  longestRun: number;
  avgRating: number;
  /** Five-star entries, one per dish. */
  fiveStars: LogEntry[];
  fiveStarCount: number;
  mostMade: { title: string; count: number; log: LogEntry }[];
  /** People whose posts you made things from, most first. */
  learnedFrom: { userId: string; count: number }[];
  /** Your own notes to self, from your best-rated entries. */
  notes: { text: string; log: LogEntry }[];
  goals: { goal: Goal; checkIns: number; longest: number; done: boolean }[];
  posts: number;
  first?: LogEntry;
};

/** Groups "Loaf #14", "Sourdough loaf (try 3)" and "sourdough loaf" together. */
export function dishKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/#\s*\d+|\b(try|attempt|batch|round|no\.?)\s*\d+\b|\b\d+(st|nd|rd|th)?\s*(try|attempt)\b/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Input = { logs: LogEntry[]; goals: Goal[]; posts: Post[] };

export function buildRecap({ logs: allLogs, goals: allGoals, posts: allPosts }: Input, userId: string, niche: NicheId, year: number, today = isoDay()): Recap {
  const prefix = String(year);
  const logs = allLogs.filter((l) => l.userId === userId && l.niche === niche && l.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
  const postsById = Object.fromEntries(allPosts.map((p) => [p.id, p]));

  const byMonth = Array.from({ length: 12 }, () => 0);
  for (const l of logs) byMonth[parseDay(l.date).getMonth()]++;
  const busiestMonth = byMonth.indexOf(Math.max(...byMonth));

  // Weeks you made something, and the longest run of them in a row.
  const weeks = [...new Set(logs.map((l) => weekKey(l.date)))].sort();
  let longestRun = 0;
  let run = 0;
  let prev: string | undefined;
  for (const w of weeks) {
    run = prev && (parseDay(w).getTime() - parseDay(prev).getTime()) / 86400000 <= 7.5 ? run + 1 : 1;
    longestRun = Math.max(longestRun, run);
    prev = w;
  }

  const groups: Record<string, LogEntry[]> = {};
  for (const l of logs) (groups[l.postId ? `post:${l.postId}` : dishKey(l.title)] ??= []).push(l);
  const mostMade = Object.values(groups)
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length || b[b.length - 1].date.localeCompare(a[a.length - 1].date))
    .slice(0, 3)
    .map((g) => {
      const best = [...g].sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))[0];
      return { title: cleanTitle(best.title), count: g.length, log: best };
    });

  const fromCounts: Record<string, number> = {};
  for (const l of logs) {
    const author = l.postId ? postsById[l.postId]?.authorId : undefined;
    if (author && author !== userId) fromCounts[author] = (fromCounts[author] ?? 0) + 1;
  }
  const learnedFrom = Object.entries(fromCounts)
    .map(([uid, count]) => ({ userId: uid, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const notes = logs
    .filter((l) => l.notes && l.notes.length > 12)
    .sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((l) => ({ text: l.notes!, log: l }));

  const goals = allGoals
    .filter((g) => g.userId === userId && g.niche === niche)
    .map((g) => {
      const inYear = g.checkIns.filter((c) => c.date.startsWith(prefix));
      return { goal: g, checkIns: inYear.length, longest: longestStreak({ ...g, checkIns: inYear }), done: !!g.doneAt && new Date(g.doneAt).getFullYear() === year };
    })
    .filter((g) => g.checkIns > 0)
    .sort((a, b) => Number(b.done) - Number(a.done) || b.checkIns - a.checkIns);

  const posts = allPosts.filter((p) => p.authorId === userId && p.niche === niche && !p.archived && new Date(p.createdAt).getFullYear() === year).length;

  return {
    year,
    ongoing: today < `${year}-12-31`,
    total: logs.length,
    distinct: Object.keys(groups).length,
    byMonth,
    busiestMonth,
    weeksActive: weeks.length,
    longestRun,
    avgRating: logs.length ? logs.reduce((n, l) => n + l.rating, 0) / logs.length : 0,
    // One tile per dish, so ten five-star sourdough loaves don't fill the page.
    fiveStars: logs
      .filter((l) => l.rating === 5)
      .reverse()
      .filter((l, i, all) => all.findIndex((x) => (x.postId ?? dishKey(x.title)) === (l.postId ?? dishKey(l.title))) === i),
    fiveStarCount: logs.filter((l) => l.rating === 5).length,
    mostMade,
    learnedFrom,
    notes,
    goals,
    posts,
    first: logs[0],
  };
}

const cleanTitle = (t: string) => t.replace(/\s*[#(].*$/, '').replace(/,?\s*(try|attempt)\s*\d+$/i, '').trim() || t;

/** A short, plain-text version for the share sheet. */
export function recapText(r: Recap, label: string, words: { things: string }): string {
  const lines = [
    `My ${r.year} in ${label}${r.ongoing ? ' (so far)' : ''}`,
    `${r.total} ${words.things} logged, ${r.distinct} different ones`,
    r.longestRun > 1 ? `${r.longestRun} weeks in a row, my longest run` : '',
    r.mostMade[0] ? `Go-to: ${r.mostMade[0].title} (${r.mostMade[0].count}×)` : '',
    r.fiveStarCount ? `${r.fiveStarCount} five-star ${r.fiveStarCount === 1 ? words.things.replace(/e?s$/, '') : words.things}` : '',
    'Made with Niches',
  ];
  return lines.filter(Boolean).join('\n');
}

// ——— Demo: a sample year ———

/** Small seeded random, so the sample year is the same every time. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dish = { title: string; color: string; postId?: string; weight: number; notes?: string[] };

const DISHES: Dish[] = [
  { title: 'Sourdough loaf', color: '#C9A877', weight: 9, notes: ['Cold proof overnight made a real ear.', 'Shaped tighter this time and it held.', 'Too dense. Starter wasn’t ready yet.'] },
  { title: 'Weeknight carbonara', color: '#E3C27A', weight: 6, notes: ['Take the pan off the heat before the eggs. Every time.'] },
  { title: 'Chili crisp (Jules’s recipe)', color: '#5E2A22', postId: 'p_chili', weight: 4, notes: ['Doubled the shallots. On everything for a week.'] },
  { title: 'Hand-cut tagliatelle', color: '#C8553D', postId: 'p_tagliatelle', weight: 4, notes: ['Roll it thinner than feels right.'] },
  { title: 'Miso butter corn', color: '#E0A43A', postId: 'p_corn', weight: 3 },
  { title: 'Herb oil', color: '#6E8B4E', postId: 'p_herboil', weight: 2, notes: ['Blanch the basil first or it goes brown.'] },
  { title: 'Beet and labneh plate', color: '#8E2F4F', postId: 'p_beets', weight: 2 },
  { title: 'Shakshuka', color: '#B3361F', weight: 3, notes: ['Crack the eggs into wells, lid on, low heat.'] },
  { title: 'Dal tadka', color: '#D9A13B', weight: 3, notes: ['Bloom the cumin until it crackles, not before.'] },
  { title: 'Smash burgers', color: '#7A4A2E', weight: 2 },
  { title: 'Pad see ew', color: '#8A5A2B', weight: 2, notes: ['Wok needs to be screaming hot. Cook in two batches.'] },
  { title: 'Lemon ricotta pancakes', color: '#F0D58C', weight: 2 },
  { title: 'Jollof rice', color: '#B4532A', weight: 2 },
  { title: 'Focaccia', color: '#D9B56A', weight: 2, notes: ['More oil in the pan than you think.'] },
  { title: 'Gnocchi', color: '#E8D9B0', weight: 1 },
  { title: 'Bibimbap', color: '#A8432C', weight: 1 },
  { title: 'Roast chicken', color: '#C0843F', weight: 1, notes: ['Dry brine the night before. Crispiest skin yet.'] },
  { title: 'Tomato galette', color: '#C2412D', weight: 1 },
  { title: 'Birria tacos', color: '#7E2A1E', weight: 1 },
  { title: 'Pierogi with Grandma', color: '#E6D3A8', weight: 1, notes: ['Write down her dough ratio before you forget.'] },
];

/**
 * Demo stand-in for a year of use: diary entries from January until today,
 * plus two goals checked in along the way. Everything is private and marked
 * `sample`, so it can be removed in one tap.
 */
export function sampleYear(userId: string, now = Date.now()): { logs: LogEntry[]; goals: Goal[] } {
  const rand = rng(2026);
  const today = new Date(now);
  const year = today.getFullYear();
  const totalWeight = DISHES.reduce((n, d) => n + d.weight, 0);
  const pick = () => {
    let r = rand() * totalWeight;
    for (const d of DISHES) if ((r -= d.weight) < 0) return d;
    return DISHES[0];
  };

  const logs: LogEntry[] = [];
  const loafCount = { n: 0 };
  // Walk the year week by week. Busier in spring and around the holidays, a quiet August.
  for (let d = new Date(year, 0, 5); d < today; d.setDate(d.getDate() + 7)) {
    const month = d.getMonth();
    const busy = month === 2 || month === 3 ? 2.2 : month === 7 ? 0.3 : month === 10 ? 1.6 : 1.2;
    const count = Math.floor(rand() * busy + (rand() < 0.75 ? 1 : 0));
    for (let i = 0; i < count; i++) {
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.floor(rand() * 6));
      if (date > today) continue;
      const dish = i === 0 && month >= 1 && month <= 3 && rand() < 0.5 ? DISHES[0] : pick();
      const iso = isoDay(0, date);
      const loaf = dish === DISHES[0] ? ++loafCount.n : 0;
      const rating = Math.min(5, Math.max(2, Math.round(3.2 + rand() * 2.2 + (loaf > 8 ? 0.6 : 0))));
      const note = dish.notes && rand() < 0.45 ? dish.notes[Math.floor(rand() * dish.notes.length)] : undefined;
      logs.push({
        id: `log_sample_${logs.length}`,
        userId,
        niche: 'cooking',
        postId: dish.postId,
        title: loaf ? `${dish.title} #${loaf}` : dish.title,
        date: iso,
        rating,
        notes: note,
        mediaColor: dish.color,
        visibility: 'private',
        createdAt: date.getTime(),
        sample: true,
      } as LogEntry);
    }
  }

  const ci = (l: LogEntry, i: number): CheckIn => ({ id: `ci_sample_${i}_${l.id}`, date: l.date, logId: l.id, createdAt: l.createdAt });
  const loaves = logs.filter((l) => l.title.startsWith('Sourdough loaf'));
  // Most home cooking never makes the diary, so the habit also gets quick
  // "Check in" taps: enough to hit 2 a week in most weeks, except rest weeks
  // and the odd missed one.
  const restWeeks = [weekKey(`${year}-05-25`), weekKey(`${year}-08-10`), weekKey(`${year}-08-17`)];
  const quick: CheckIn[] = [];
  const thisWeek = weekKey(isoDay(0, today));
  for (let w = weekKey(`${year}-01-05`); w < thisWeek; w = isoDay(7, parseDay(w))) {
    if (restWeeks.includes(w) || rand() < 0.1) continue;
    const have = logs.filter((l) => weekKey(l.date) === w).length;
    for (let k = have; k < 2; k++) {
      const date = isoDay(1 + k * 2, parseDay(w));
      quick.push({ id: `ci_sample_q_${quick.length}`, date, createdAt: parseDay(date).getTime() });
    }
  }
  const loafGoalDone = loaves[11];
  const goals: Goal[] = [
    {
      id: 'goal_sample_home',
      userId,
      niche: 'cooking',
      kind: 'habit',
      title: 'Cook at home 2× a week',
      perWeek: 2,
      visibility: 'private',
      // Two rest weeks in August (vacation) and one in the spring.
      restWeeks,
      checkIns: [...logs.map(ci), ...quick],
      createdAt: new Date(year, 0, 4).getTime(),
      sample: true,
    },
    {
      id: 'goal_sample_loaves',
      userId,
      niche: 'cooking',
      kind: 'total',
      title: 'Bake 12 loaves',
      target: 12,
      unit: 'loaves',
      visibility: 'profile',
      restWeeks: [],
      checkIns: loaves.slice(0, 12).map(ci),
      doneAt: loafGoalDone ? loafGoalDone.createdAt : undefined,
      createdAt: new Date(year, 0, 10).getTime(),
      sample: true,
    },
  ];
  return { logs, goals };
}

/** Top 4 from a sample year: the best-rated, most-made dishes. */
export function sampleFavorites(logs: LogEntry[]): FavoriteRef[] {
  const seen = new Set<string>();
  return [...logs]
    .sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))
    .filter((l) => {
      const k = l.postId ?? dishKey(l.title);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, MAX_FAVORITES)
    .map((l) => ({ kind: 'log', id: l.id }));
}
