import type { Post } from './types';

/**
 * Saved boards (Pinterest-style collections inside Saved). Founder's choices,
 * Nov 2026: saving is instant and then offers "Add to board"; boards are
 * private unless you put them on your profile; one board can mix niches; a
 * board shows as a three-photo collage.
 */
export type Board = {
  id: string;
  ownerId: string;
  name: string;
  /** Newest first. Every post on your board is also in your saves. */
  postIds: string[];
  visibility: 'private' | 'profile';
  createdAt: number;
  updatedAt: number;
  /** Demo boards added with "Demo: add sample boards". */
  sample?: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

/** Public boards on demo profiles, so boards show up on other people's profiles too. */
export function seedBoards(now: number): Board[] {
  return [
    { id: 'b_maya_pasta', ownerId: 'u_maya', name: 'Pasta to try', postIds: ['p_gnocchi', 'p_ines_sauce', 'p_chili', 'p_corn'], visibility: 'profile', createdAt: now - 20 * DAY, updatedAt: now - 1 * DAY },
    { id: 'b_nadia_light', ownerId: 'u_nadia', name: 'Light I keep coming back to', postIds: ['p_photo_night', 'p_art_harbor', 'p_photo_market'], visibility: 'profile', createdAt: now - 30 * DAY, updatedAt: now - 2 * DAY },
  ];
}

/** Sample saves and boards for your own Saved tab, so the demo shows how boards look. */
export function sampleBoards(meId: string, now: number): { saves: string[]; boards: Board[] } {
  const boards: Board[] = [
    { id: 'b_sample_weeknight', ownerId: meId, name: 'Weeknight dinners', postIds: ['p_gnocchi', 'p_corn', 'p_beets', 'p_chili'], visibility: 'private', createdAt: now - 9 * DAY, updatedAt: now - 1 * DAY, sample: true },
    { id: 'b_sample_film', ownerId: meId, name: 'Film ideas', postIds: ['p_photo_golden', 'p_photo_night', 'p_photo_fog'], visibility: 'profile', createdAt: now - 6 * DAY, updatedAt: now - 2 * DAY, sample: true },
    { id: 'b_sample_paint', ownerId: meId, name: 'Paint this next', postIds: ['p_art_harbor', 'p_art_lemons', 'p_art_street'], visibility: 'private', createdAt: now - 4 * DAY, updatedAt: now - 3 * DAY, sample: true },
  ];
  const saves = [...new Set([...boards.flatMap((b) => b.postIds), 'p_sourdough', 'p_herboil', 'p_photo_market'])];
  return { saves, boards };
}

/** A board's posts that still exist, in board order. */
export function boardPosts(board: Board, posts: Post[]): Post[] {
  const byId = new Map(posts.map((p) => [p.id, p]));
  return board.postIds.map((id) => byId.get(id)).filter((p): p is Post => !!p && !p.archived);
}

export function savesLabel(n: number): string {
  return `${n} ${n === 1 ? 'save' : 'saves'}`;
}
