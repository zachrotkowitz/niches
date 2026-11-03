// App state for the demo. Everything lives on the device (AsyncStorage) for
// now; Supabase replaces this layer in the next step, behind the same actions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { SEED_USERS, seedComments, seedPosts } from './seed';
import type { NicheId } from './theme';
import type { Comment, Post, PostKind, User } from './types';

const STORAGE_KEY = 'niches:demo:v1';

export type FeedLayout = 'posts' | 'grid';

export type Me = User & { birthDate: string };

type State = {
  hydrated: boolean;
  me: Me | null;
  niche: NicheId;
  layout: FeedLayout;
  posts: Post[];
  comments: Comment[];
  cheers: Record<string, true>;
  saves: Record<string, true>;
  notify: Partial<Record<NicheId, true>>;
  nicheRequests: string[];
};

type Persisted = Omit<State, 'hydrated'>;

type Action =
  | { type: 'hydrate'; state: Persisted }
  | { type: 'signUp'; me: Me }
  | { type: 'reset'; state: Persisted }
  | { type: 'setNiche'; niche: NicheId }
  | { type: 'setLayout'; layout: FeedLayout }
  | { type: 'toggleCheer'; postId: string }
  | { type: 'toggleSave'; postId: string }
  | { type: 'addComment'; comment: Comment }
  | { type: 'addPost'; post: Post }
  | { type: 'toggleNotify'; niche: NicheId }
  | { type: 'requestNiche'; name: string };

function freshState(): Persisted {
  const now = Date.now();
  return {
    me: null,
    niche: 'cooking',
    layout: 'posts',
    posts: seedPosts(now),
    comments: seedComments(now),
    cheers: {},
    saves: {},
    notify: {},
    nicheRequests: [],
  };
}

function toggle(map: Record<string, true>, key: string): Record<string, true> {
  const next = { ...map };
  if (next[key]) delete next[key];
  else next[key] = true;
  return next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...action.state, hydrated: true };
    case 'reset':
      return { ...action.state, hydrated: true };
    case 'signUp':
      return { ...state, me: action.me };
    case 'setNiche':
      return { ...state, niche: action.niche };
    case 'setLayout':
      return { ...state, layout: action.layout };
    case 'toggleCheer':
      return { ...state, cheers: toggle(state.cheers, action.postId) };
    case 'toggleSave':
      return { ...state, saves: toggle(state.saves, action.postId) };
    case 'addComment':
      return { ...state, comments: [...state.comments, action.comment] };
    case 'addPost':
      return { ...state, posts: [action.post, ...state.posts] };
    case 'toggleNotify': {
      const notify = { ...state.notify };
      if (notify[action.niche]) delete notify[action.niche];
      else notify[action.niche] = true;
      return { ...state, notify };
    }
    case 'requestNiche':
      return { ...state, nicheRequests: [...state.nicheRequests, action.name] };
  }
}

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, { ...freshState(), hydrated: false });

  // Load saved state once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        dispatch({ type: 'hydrate', state: raw ? { ...freshState(), ...JSON.parse(raw) } : freshState() });
      })
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

  const actions = useMemo(
    () => ({
      signUp(input: { displayName: string; username: string; birthDate: string }) {
        dispatch({ type: 'signUp', me: { id: 'u_me', avatarColor: '#1E6B47', ...input } });
      },
      resetDemo() {
        const fresh = freshState();
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        dispatch({ type: 'reset', state: fresh });
      },
      setNiche: (niche: NicheId) => dispatch({ type: 'setNiche', niche }),
      setLayout: (layout: FeedLayout) => dispatch({ type: 'setLayout', layout }),
      toggleCheer: (postId: string) => dispatch({ type: 'toggleCheer', postId }),
      toggleSave: (postId: string) => dispatch({ type: 'toggleSave', postId }),
      toggleNotify: (niche: NicheId) => dispatch({ type: 'toggleNotify', niche }),
      requestNiche: (name: string) => dispatch({ type: 'requestNiche', name }),
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

  return { state, usersById, actions };
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

/** Private counts: real numbers only the post's author is shown. */
export function postStats(state: State, post: Post) {
  return {
    cheers: (post.seedCheers ?? 0) + (state.cheers[post.id] ? 1 : 0),
    saves: (post.seedSaves ?? 0) + (state.saves[post.id] ? 1 : 0),
    comments: state.comments.filter((c) => c.postId === post.id).length,
  };
}
