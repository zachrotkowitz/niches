// The personal record that makes Niches useful with zero friends, like
// Letterboxd's diary or Strava's log: what you made, when, how it went.
// Entries are private by default; you can show one on your profile or share it as a post.

import type { NicheId } from './theme';

export type LogVisibility = 'private' | 'profile';

export type LogEntry = {
  id: string;
  userId: string;
  niche: NicheId;
  /** The post or recipe this was made from, if any. */
  postId?: string;
  title: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** ½–5 stars, in half-star steps. */
  rating: number;
  notes?: string;
  imageUri?: string;
  /** Placeholder color when there's no photo. */
  mediaColor?: string;
  visibility: LogVisibility;
  /** Set when the entry was also shared as a post. */
  sharedPostId?: string;
  createdAt: number;
  /** Demo sample data ("fill in a sample year"), removable in one tap. */
  sample?: boolean;
};

/** A Top 4 slot: one of your diary entries, or a post (yours or one you saved). */
export type FavoriteRef = {
  kind: 'post' | 'log';
  id: string;
  /** Optional name for this pick in your Top 4. Without it, the tile follows the post's caption or the entry's title. */
  title?: string;
};

/** Up to four per niche. */
export type Favorites = Partial<Record<NicheId, FavoriteRef[]>>;

export const MAX_FAVORITES = 4;

/** Niche-specific words, so the same features read naturally in every niche. */
export function diaryWords(niche: NicheId) {
  switch (niche) {
    case 'cooking':
      return { did: 'I made this', want: 'Want to make', wantList: 'Want to make', thing: 'dish', things: 'dishes', diary: 'Cooking diary', top: 'Top 4 dishes' };
    case 'art':
      return { did: 'I made this', want: 'Want to try', wantList: 'Want to try', thing: 'piece', things: 'pieces', diary: 'Art diary', top: 'Top 4 pieces' };
    case 'photography':
      return { did: 'I shot this', want: 'Want to shoot', wantList: 'Want to shoot', thing: 'shoot', things: 'shoots', diary: 'Photo diary', top: 'Top 4 photos' };
    case 'gym':
      return { did: 'I did this', want: 'Want to try', wantList: 'Want to try', thing: 'workout', things: 'workouts', diary: 'Training log', top: 'Top 4 workouts' };
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
const day = (now: number, back: number) => {
  const d = new Date(now - back * 24 * 3600 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Demo diary entries for made-up accounts, visible on their profiles. */
export function seedLogs(now: number): LogEntry[] {
  return [
    { id: 'log_maya_1', userId: 'u_maya', niche: 'cooking', postId: 'p_chili', title: 'Chili crisp (Jules’s recipe)', date: day(now, 1), rating: 5, notes: 'Doubled the shallots. On everything this week.', mediaColor: '#5E2A22', visibility: 'profile', createdAt: now - 1 * 86400000 },
    { id: 'log_maya_2', userId: 'u_maya', niche: 'cooking', postId: 'p_tagliatelle', title: 'Hand-cut tagliatelle, try 3', date: day(now, 0), rating: 3.5, notes: 'Still too thick. Roll thinner next time.', mediaColor: '#C8553D', visibility: 'profile', createdAt: now - 3600000 },
    { id: 'log_maya_3', userId: 'u_maya', niche: 'cooking', postId: 'p_corn', title: 'Miso butter corn', date: day(now, 4), rating: 4, mediaColor: '#E0A43A', visibility: 'profile', createdAt: now - 4 * 86400000 },
    { id: 'log_maya_4', userId: 'u_maya', niche: 'cooking', title: 'Grandma’s jollof rice', date: day(now, 9), rating: 5, notes: 'Finally tastes like hers.', mediaColor: '#B4532A', visibility: 'profile', createdAt: now - 9 * 86400000 },
    { id: 'log_dev_1', userId: 'u_dev', niche: 'cooking', postId: 'p_sourdough', title: 'Loaf #14', date: day(now, 0), rating: 5, mediaColor: '#C9A877', visibility: 'profile', createdAt: now - 3600000 },
    { id: 'log_dev_2', userId: 'u_dev', niche: 'cooking', title: 'Focaccia, 80% hydration', date: day(now, 6), rating: 4, mediaColor: '#D9B56A', visibility: 'profile', createdAt: now - 6 * 86400000 },
  ];
}

/** Demo Top 4s for made-up accounts, keyed by user id. */
export function seedFavorites(): Record<string, Favorites> {
  return {
    u_maya: {
      cooking: [
        { kind: 'log', id: 'log_maya_4' },
        { kind: 'post', id: 'p_ravioli' },
        { kind: 'log', id: 'log_maya_1' },
        { kind: 'post', id: 'p_tagliatelle' },
      ],
      art: [{ kind: 'post', id: 'p_art_lemons' }],
    },
    u_ines: {
      cooking: [
        { kind: 'post', id: 'p_ines_sauce' },
        { kind: 'post', id: 'p_ines_shortrib' },
      ],
    },
    u_rosa: { art: [{ kind: 'post', id: 'p_art_harbor' }] },
    u_nadia: {
      photography: [
        { kind: 'post', id: 'p_photo_golden' },
        { kind: 'post', id: 'p_photo_fog' },
      ],
    },
  };
}
