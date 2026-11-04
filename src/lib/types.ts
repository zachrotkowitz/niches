import type { NicheId } from './theme';

export type PostKind = 'photo' | 'video' | 'text';

/** How a post's tile is shaped in grids (the "preview" the author can adjust). */
export type PreviewShape = 'tall' | 'square' | 'short';

export type User = {
  id: string;
  displayName: string;
  username: string;
  /** Avatar background color until real photos exist. */
  avatarColor: string;
  bio?: string;
  /** Demo-only marker for made-up founding creators in not-yet-open niches. */
  foundingCreator?: boolean;
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

  // Author settings from the post's "⋯" menu.
  /** Hidden from feeds and the profile; only the author sees it, under Archive. */
  archived?: boolean;
  /** No new comments, and existing ones are hidden. */
  commentsOff?: boolean;
  /** Hides the cheer count from the author too (it's always hidden from everyone else). */
  hideCheers?: boolean;
  /** Grid tile shape. Defaults to a varied height. */
  previewShape?: PreviewShape;
  /** Title shown under the grid tile. Defaults to the media label or caption. */
  previewTitle?: string;
  editedAt?: number;
};

export type ReportReason = 'spam' | 'harassment' | 'harmful' | 'stolen' | 'other';
