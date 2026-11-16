import { postPhoto } from './demo-photos';
import type { Post, User } from './types';

/** Profile cover (founder, Nov 2026): one, two or three of your photos in a layout you pick. */
export type CoverLayout = 'one' | 'two-side' | 'two-stack' | 'three-left' | 'three-right' | 'three-row';
export type Cover = { layout: CoverLayout; postIds: string[] };

export const COVER_LAYOUTS: { id: CoverLayout; label: string; count: number }[] = [
  { id: 'one', label: 'One photo', count: 1 },
  { id: 'two-side', label: 'Two, side by side', count: 2 },
  { id: 'two-stack', label: 'Two, stacked', count: 2 },
  { id: 'three-left', label: 'Three, big left', count: 3 },
  { id: 'three-right', label: 'Three, big right', count: 3 },
  { id: 'three-row', label: 'Three, side by side', count: 3 },
];

export function coverCount(layout: CoverLayout): number {
  return COVER_LAYOUTS.find((l) => l.id === layout)?.count ?? 1;
}

/** A person's posts that can go on a cover: visible ones with a photo, most saved first. */
export function coverCandidates(posts: Post[], userId: string): Post[] {
  return posts
    .filter((p) => p.authorId === userId && !p.archived && !p.premium && p.kind !== 'text' && !!postPhoto(p))
    .sort((a, b) => (b.seedSaves ?? 0) - (a.seedSaves ?? 0) || b.createdAt - a.createdAt);
}

/**
 * The cover to show for a profile: the one they styled, or an automatic one
 * from their most-saved photos. Null when they have no photos yet.
 */
export function coverFor(user: User, posts: Post[]): { layout: CoverLayout; posts: Post[] } | null {
  const pool = coverCandidates(posts, user.id);
  if (user.cover) {
    const chosen = user.cover.postIds.map((id) => pool.find((p) => p.id === id)).filter((p): p is Post => !!p);
    if (chosen.length) return { layout: user.cover.layout, posts: chosen.slice(0, coverCount(user.cover.layout)) };
  }
  if (!pool.length) return null;
  const layout: CoverLayout = pool.length >= 3 ? 'three-left' : pool.length === 2 ? 'two-side' : 'one';
  return { layout, posts: pool.slice(0, coverCount(layout)) };
}
