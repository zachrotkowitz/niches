// App state for the demo. Everything lives on the device (AsyncStorage) for
// now; Supabase replaces this layer later, behind the same actions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { SEED_FOLLOWS, SEED_USERS, SEED_VERSION, seedComments, seedPosts, WEEK_MS } from './seed';
import { NICHE_ORDER, resolveNiches, type NicheId } from './theme';
import type { Comment, Post, PostKind, ReportReason, User } from './types';

const STORAGE_KEY = 'niches:demo:v1';

export type FeedLayout = 'posts' | 'grid';

export type Me = User & { birthDate: string };

/** Fields the author can change from the post menu or the edit screen. */
export type PostPatch = Partial<Pick<Post, 'caption' | 'progressLabel' | 'archived' | 'commentsOff' | 'hideCheers' | 'previewShape' | 'previewTitle' | 'editedAt'>>;

type State = {
  hydrated: boolean;
  seedVersion: number;
  me: Me | null;
  niche: NicheId;
  layout: FeedLayout;
  posts: Post[];
  comments: Comment[];
  cheers: Record<string, true>;
  saves: Record<string, true>;
  following: Record<string, true>;
  /** Posts the user marked "Not interested". */
  hiddenPosts: Record<string, true>;
  /** Seed posts the user deleted, so a seed refresh doesn't bring them back. */
  deletedPostIds: string[];
  reports: { postId: string; reason: ReportReason; at: number }[];
  notify: Partial<Record<NicheId, true>>;
  nicheRequests: string[];
  /** Palettes chosen in the Color lab. */
  palettes: Partial<Record<NicheId, string>>;
  /** Niches shown on Discover. Empty means all. */
  discoverNiches: NicheId[];
};

type Persisted = Omit<State, 'hydrated'>;

type Action =
  | { type: 'hydrate'; state: Persisted }
  | { type: 'signUp'; me: Me }
  | { type: 'setNiche'; niche: NicheId }
  | { type: 'setLayout'; layout: FeedLayout }
  | { type: 'toggle'; key: 'cheers' | 'saves' | 'following' | 'hiddenPosts'; id: string }
  | { type: 'addComment'; comment: Comment }
  | { type: 'addPost'; post: Post }
  | { type: 'updatePost'; id: string; patch: PostPatch }
  | { type: 'deletePost'; id: string }
  | { type: 'report'; postId: string; reason: ReportReason }
  | { type: 'toggleNotify'; niche: NicheId }
  | { type: 'requestNiche'; name: string }
  | { type: 'setPalette'; niche: NicheId; paletteId: string | null }
  | { type: 'setDiscoverNiches'; niches: NicheId[] };

function freshState(): Persisted {
  const now = Date.now();
  return {
    seedVersion: SEED_VERSION,
    me: null,
    niche: 'cooking',
    layout: 'posts',
    posts: seedPosts(now),
    comments: seedComments(now),
    cheers: {},
    saves: {},
    following: {},
    hiddenPosts: {},
    deletedPostIds: [],
    reports: [],
    notify: {},
    nicheRequests: [],
    palettes: {},
    discoverNiches: [],
  };
}

/** Loads saved state and adds any demo content introduced since it was saved. */
function migrate(saved: Partial<Persisted>): Persisted {
  const fresh = freshState();
  const merged: Persisted = { ...fresh, ...saved };
  if ((saved.seedVersion ?? 1) < SEED_VERSION) {
    const deleted = new Set(merged.deletedPostIds);
    const havePosts = new Set(merged.posts.map((p) => p.id));
    const haveComments = new Set(merged.comments.map((c) => c.id));
    merged.posts = [...merged.posts, ...fresh.posts.filter((p) => !havePosts.has(p.id) && !deleted.has(p.id))];
    merged.comments = [...merged.comments, ...fresh.comments.filter((c) => !haveComments.has(c.id) && !deleted.has(c.postId))];
    merged.seedVersion = SEED_VERSION;
  }
  return merged;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...action.state, hydrated: true };
    case 'signUp':
      return { ...state, me: action.me };
    case 'setNiche':
      return { ...state, niche: action.niche };
    case 'setLayout':
      return { ...state, layout: action.layout };
    case 'toggle': {
      const next = { ...state[action.key] };
      if (next[action.id]) delete next[action.id];
      else next[action.id] = true;
      return { ...state, [action.key]: next };
    }
    case 'addComment':
      return { ...state, comments: [...state.comments, action.comment] };
    case 'addPost':
      return { ...state, posts: [action.post, ...state.posts] };
    case 'updatePost':
      return { ...state, posts: state.posts.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    case 'deletePost':
      return {
        ...state,
        posts: state.posts.filter((p) => p.id !== action.id),
        comments: state.comments.filter((c) => c.postId !== action.id),
        deletedPostIds: [...state.deletedPostIds, action.id],
      };
    case 'report':
      return { ...state, reports: [...state.reports, { postId: action.postId, reason: action.reason, at: Date.now() }], hiddenPosts: { ...state.hiddenPosts, [action.postId]: true } };
    case 'toggleNotify': {
      const notify = { ...state.notify };
      if (notify[action.niche]) delete notify[action.niche];
      else notify[action.niche] = true;
      return { ...state, notify };
    }
    case 'requestNiche':
      return { ...state, nicheRequests: [...state.nicheRequests, action.name] };
    case 'setPalette': {
      const palettes = { ...state.palettes };
      if (action.paletteId) palettes[action.niche] = action.paletteId;
      else delete palettes[action.niche];
      return { ...state, palettes };
    }
    case 'setDiscoverNiches':
      return { ...state, discoverNiches: action.niches };
  }
}

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, { ...freshState(), hydrated: false });

  // Load saved state once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? migrate(JSON.parse(raw)) : freshState() }))
      .catch(() => dispatch({ type: 'hydrate', state: freshState() }));
  }, []);

  // Save after every change (the demo state is small).
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _hydrated, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of SEED_USERS) map[u.id] = u;
    if (state.me) map[state.me.id] = state.me;
    return map;
  }, [state.me]);

  const niches = useMemo(() => resolveNiches(state.palettes), [state.palettes]);

  const actions = useMemo(
    () => ({
      signUp(input: { displayName: string; username: string; birthDate: string }) {
        dispatch({ type: 'signUp', me: { id: 'u_me', avatarColor: '#1E6B47', ...input } });
      },
      resetDemo() {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        dispatch({ type: 'hydrate', state: freshState() });
      },
      setNiche: (niche: NicheId) => dispatch({ type: 'setNiche', niche }),
      setLayout: (layout: FeedLayout) => dispatch({ type: 'setLayout', layout }),
      toggleCheer: (postId: string) => dispatch({ type: 'toggle', key: 'cheers', id: postId }),
      toggleSave: (postId: string) => dispatch({ type: 'toggle', key: 'saves', id: postId }),
      toggleFollow: (userId: string) => dispatch({ type: 'toggle', key: 'following', id: userId }),
      toggleHidden: (postId: string) => dispatch({ type: 'toggle', key: 'hiddenPosts', id: postId }),
      toggleNotify: (niche: NicheId) => dispatch({ type: 'toggleNotify', niche }),
      requestNiche: (name: string) => dispatch({ type: 'requestNiche', name }),
      updatePost: (id: string, patch: PostPatch) => dispatch({ type: 'updatePost', id, patch }),
      deletePost: (id: string) => dispatch({ type: 'deletePost', id }),
      report: (postId: string, reason: ReportReason) => dispatch({ type: 'report', postId, reason }),
      setPalette: (niche: NicheId, paletteId: string | null) => dispatch({ type: 'setPalette', niche, paletteId }),
      setDiscoverNiches: (niches: NicheId[]) => dispatch({ type: 'setDiscoverNiches', niches }),
      addComment(postId: string, authorId: string, text: string) {
        dispatch({ type: 'addComment', comment: { id: makeId('c'), postId, authorId, text, createdAt: Date.now() } });
      },
      createPost(input: { authorId: string; niche: NicheId; kind: PostKind; caption: string; mediaColor?: string; mediaLabel?: string; progressLabel?: string }): string {
        const id = makeId('p');
        dispatch({ type: 'addPost', post: { id, createdAt: Date.now(), ...input } });
        return id;
      },
    }),
    [],
  );

  return { state, usersById, niches, actions };
}

type StoreValue = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside <StoreProvider>');
  return value;
}

/** Niche colors with any Color lab choices applied. */
export function useNiches() {
  return useStore().niches;
}

/** Private counts: real numbers only the post's author is shown. */
export function postStats(state: State, post: Post) {
  return {
    cheers: (post.seedCheers ?? 0) + (state.cheers[post.id] ? 1 : 0),
    saves: (post.seedSaves ?? 0) + (state.saves[post.id] ? 1 : 0),
    comments: state.comments.filter((c) => c.postId === post.id).length,
  };
}

/**
 * Followers and following for any account, as user ids. Demo accounts follow
 * each other (seed data); your own follows come from state.
 */
export function connections(state: State, userId: string) {
  const meId = state.me?.id;
  const following =
    userId === meId ? Object.keys(state.following) : SEED_FOLLOWS.filter(([from]) => from === userId).map(([, to]) => to);
  const followers = SEED_FOLLOWS.filter(([, to]) => to === userId).map(([from]) => from);
  if (meId && userId !== meId && state.following[userId]) followers.push(meId);
  return { followers, following };
}

/** Whether a post belongs in public feeds for this viewer. */
export function isVisible(state: State, post: Post) {
  return !post.archived && !state.hiddenPosts[post.id];
}

/**
 * Discover's "inspiration this week": posts from the last 7 days, most saved
 * first. The counts are used for ordering only and never shown.
 */
export function inspirationThisWeek(state: State, niches: NicheId[], now = Date.now()) {
  const allowed = new Set(niches.length ? niches : NICHE_ORDER);
  return state.posts
    .filter((p) => allowed.has(p.niche) && isVisible(state, p) && now - p.createdAt < WEEK_MS && p.authorId !== state.me?.id)
    .map((p) => ({ post: p, score: postStats(state, p).saves }))
    .sort((a, b) => b.score - a.score || b.post.createdAt - a.post.createdAt)
    .map((x) => x.post);
}
