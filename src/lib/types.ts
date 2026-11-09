import type { NicheId } from './theme';

export type PostKind = 'photo' | 'video' | 'text';

/** How a post's tile is shaped in grids (the "preview" the author can adjust). */
export type PreviewShape = 'tall' | 'square' | 'short';

export type User = {
  id: string;
  displayName: string;
  username: string;
  /** Avatar background color, shown with an initial when there's no photo. */
  avatarColor: string;
  /** Profile photo, when one was picked. */
  avatarUri?: string;
  bio?: string;
  /** Demo-only marker for made-up founding creators in not-yet-open niches. */
  foundingCreator?: boolean;
  /** Blue check: identity confirmed and notable (e.g. a celebrity cook). Invite-only. */
  verified?: boolean;
  /** Premium creator: can charge for members-only content. Invite-only. */
  membership?: Membership;
};

/** What a premium creator offers members. */
export type Membership = {
  /** Monthly price in cents. */
  priceCents: number;
  tagline: string;
  perks: string[];
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
  /** Placeholder color standing in for the photo or video when there's no real image. */
  mediaColor?: string;
  /** A real photo (local file on phones, inline data on web) when one was picked. */
  imageUri?: string;
  /** Photo height ÷ width, so feeds can show it at its natural shape. */
  imageAspect?: number;
  /** Describes the media, for screen readers and the placeholder label. */
  mediaLabel?: string;
  /** Video length in seconds (videos are capped at 90s). */
  durationSec?: number;
  /** Set when this is a progress post toward a goal. */
  progressLabel?: string;
  /** The goal a progress post belongs to. */
  goalId?: string;
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
  /** Members-only: locked for anyone who isn't a member (or hasn't unlocked it). */
  premium?: boolean;
  /** Optional one-time price to unlock just this post, in cents. */
  unlockCents?: number;
};

export type ReportReason = 'spam' | 'harassment' | 'harmful' | 'stolen' | 'other';
