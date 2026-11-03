import type { NicheId } from './theme';

export type PostKind = 'photo' | 'video' | 'text';

export type User = {
  id: string;
  displayName: string;
  username: string;
  /** Avatar background color until real photos exist. */
  avatarColor: string;
  bio?: string;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
};

export type Post = {
  id: string;
  authorId: string;
  niche: NicheId;
  kind: PostKind;
  caption: string;
  createdAt: number;
  /** Placeholder color standing in for the photo or video until uploads exist. */
  mediaColor?: string;
  /** Describes the media, for screen readers and the placeholder label. */
  mediaLabel?: string;
  /** Video length in seconds (videos are capped at 90s). */
  durationSec?: number;
  /** Set when this is a progress post toward a goal. */
  progressLabel?: string;
  /** Cheers from people who are not in the demo's user list. */
  seedCheers?: number;
  /** Saves from people who are not in the demo's user list. */
  seedSaves?: number;
};
