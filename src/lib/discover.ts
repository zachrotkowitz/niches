import { canSee, type Plan } from './plans';
import { SEED_USERS } from './seed';
import type { Listing } from './shop';
import { inFeeds, inspirationThisWeek, postStats, type useStore } from './store';
import { NICHE_ORDER, type NicheId } from './theme';
import { matchesTopic, postText, TOPICS } from './topics';
import type { Post, User } from './types';

type State = ReturnType<typeof useStore>['state'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Week of Nov 9": Discover's picks change every Monday. */
export function weekOfLabel(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `Week of ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * The posts saved most this week in these niches (all niches when empty).
 * Demo content ages, so when the week runs thin it tops up with the most-saved
 * older posts and says "lately" instead of "this week". Counts are never shown.
 */
export function weekFavorites(state: State, niches: NicheId[], min = 6): { posts: Post[]; lately: boolean } {
  const week = inspirationThisWeek(state, niches);
  if (week.length >= min) return { posts: week, lately: false };
  const allowed = new Set(niches.length ? niches : NICHE_ORDER);
  const have = new Set(week.map((p) => p.id));
  const older = state.posts
    .filter((p) => !have.has(p.id) && allowed.has(p.niche) && inFeeds(state, p) && p.authorId !== state.me?.id)
    .sort((a, b) => postStats(state, b).saves - postStats(state, a).saves || b.createdAt - a.createdAt);
  return { posts: [...week, ...older], lately: true };
}

export function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/^@/, '').replace(/\s+/g, ' ');
}

function topicHit(p: Post, q: string): boolean {
  return TOPICS[p.niche].some((t) => t.label.toLowerCase().includes(q) && matchesTopic(p, t));
}

export function searchPosts(state: State, usersById: Record<string, User>, q: string): Post[] {
  if (!q) return [];
  return state.posts
    .filter((p) => inFeeds(state, p))
    .filter((p) => postText(p).includes(q) || topicHit(p, q) || (usersById[p.authorId]?.username ?? '').includes(q))
    .sort((a, b) => postStats(state, b).saves - postStats(state, a).saves || b.createdAt - a.createdAt);
}

export function searchPeople(state: State, q: string): User[] {
  if (!q) return [];
  return SEED_USERS.filter((u) => u.id !== state.me?.id).filter(
    (u) => u.displayName.toLowerCase().includes(q) || u.username.includes(q) || (u.bio ?? '').toLowerCase().includes(q),
  );
}

export function searchListings(state: State, q: string): Listing[] {
  if (!q) return [];
  return state.listings
    .filter((l) => l.sellerId !== state.me?.id && `${l.title} ${l.description} ${l.category}`.toLowerCase().includes(q))
    .sort((a, b) => b.sold - a.sold);
}

export function searchPlans(state: State, q: string): Plan[] {
  if (!q) return [];
  return state.plans.filter((p) => canSee(p, state.me?.id) && `${p.title} ${p.notes ?? ''} ${p.location ?? ''}`.toLowerCase().includes(q));
}

export type Suggestion = { text: string; niche?: NicheId; plan?: boolean };

/** Things to search for: topics, post titles, shop items and plans that contain what you typed. */
function phrases(state: State): Suggestion[] {
  const out: Suggestion[] = [];
  for (const n of NICHE_ORDER) for (const t of TOPICS[n]) out.push({ text: t.label.toLowerCase(), niche: n });
  for (const p of state.posts) if (p.mediaLabel && inFeeds(state, p)) out.push({ text: p.mediaLabel.toLowerCase(), niche: p.niche });
  for (const l of state.listings) out.push({ text: l.title.toLowerCase(), niche: l.niche });
  for (const p of state.plans) if (canSee(p, state.me?.id)) out.push({ text: p.title.toLowerCase(), niche: p.niche, plan: true });
  return out;
}

export function suggestions(state: State, q: string, limit = 4): Suggestion[] {
  if (!q) return [];
  const seen = new Set<string>();
  const hits = phrases(state).filter((s) => {
    if (seen.has(s.text) || !s.text.includes(q)) return false;
    seen.add(s.text);
    return true;
  });
  // Words that start with what you typed come first, then shorter ones.
  const starts = (s: Suggestion) => (s.text.startsWith(q) ? 0 : s.text.split(' ').some((w) => w.startsWith(q)) ? 1 : 2);
  return hits.sort((a, b) => starts(a) - starts(b) || a.text.length - b.text.length).slice(0, limit);
}

/** Other searches near this one: topics and titles from the posts it found. */
export function relatedSearches(state: State, q: string, posts: Post[], limit = 4): string[] {
  const out: string[] = [];
  const add = (t: string) => {
    const s = t.toLowerCase();
    if (s !== q && !out.includes(s) && out.length < limit) out.push(s);
  };
  for (const p of posts) for (const t of TOPICS[p.niche]) if (matchesTopic(p, t)) add(t.label);
  for (const p of posts) if (p.mediaLabel) add(p.mediaLabel);
  return out;
}
