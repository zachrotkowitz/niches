// App state for the demo. Everything lives on the device (AsyncStorage) for
// now; Supabase replaces this layer later, behind the same actions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import type { CreatorApplication } from './creators';
import { MAX_FAVORITES, seedFavorites, seedLogs, type FavoriteRef, type LogEntry } from './diary';
import { seedGoals, type CheckIn, type Goal } from './goals';
import { sampleFavorites, sampleYear } from './recap';
import { seedPlans, type DishIdea, type Plan, type PlanItem, type Rsvp } from './plans';
import { feeFor, seedListings, type CartItem, type Listing, type Order, type OrderStatus } from './shop';
import { SEED_FOLLOWS, SEED_USERS, SEED_VERSION, seedComments, seedPosts, WEEK_MS } from './seed';
import { appGround, DEFAULT_APP_GROUND, NICHE_ORDER, resolveNiches, type NicheId } from './theme';
import type { Comment, Membership, Post, PostKind, ReportReason, User } from './types';

const STORAGE_KEY = 'niches:demo:v1';

export type FeedLayout = 'posts' | 'grid';

export type Me = User & { birthDate: string };

/** Fields the author can change from the post menu or the edit screen. */
export type PostPatch = Partial<Pick<Post, 'caption' | 'mediaLabel' | 'progressLabel' | 'archived' | 'commentsOff' | 'hideCheers' | 'previewShape' | 'previewTitle' | 'editedAt' | 'premium' | 'unlockCents'>>;

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
  plans: Plan[];
  /** Home shows each niche's feed or its shop. */
  homeMode: 'feed' | 'shop';
  listings: Listing[];
  savedListings: Record<string, true>;
  cart: CartItem[];
  orders: Order[];
  /** Creators you're a member of, with the time you joined. */
  memberships: Record<string, number>;
  /** Members-only posts you unlocked one at a time. */
  unlocks: Record<string, true>;
  creatorApplication: CreatorApplication | null;
  /** Demo: pretend members of your own membership. */
  demoMembers: number;
  /** Diary entries ("I made this"), yours and demo accounts'. */
  logs: LogEntry[];
  /** Your "Want to make" list: post id → when added. */
  wantList: Record<string, number>;
  /** Top 4 per niche, keyed by user id. */
  favorites: Record<string, Partial<Record<NicheId, FavoriteRef[]>>>;
  /** Goals, yours and demo accounts'. */
  goals: Goal[];
  /** Background for non-niche screens (Color lab). */
  appGround: string;
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
  | { type: 'setDiscoverNiches'; niches: NicheId[] }
  | { type: 'addPlan'; plan: Plan }
  | { type: 'mapPlan'; id: string; fn: (plan: Plan) => Plan }
  | { type: 'deletePlan'; id: string }
  | { type: 'setHomeMode'; mode: 'feed' | 'shop' }
  | { type: 'toggleSavedListing'; id: string }
  | { type: 'addListing'; listing: Listing }
  | { type: 'deleteListing'; id: string }
  | { type: 'setCart'; cart: CartItem[] }
  | { type: 'placeOrders'; orders: Order[] }
  | { type: 'setOrderStatus'; id: string; status: OrderStatus }
  | { type: 'setMembership'; creatorId: string; on: boolean }
  | { type: 'unlock'; postId: string }
  | { type: 'setApplication'; application: CreatorApplication | null }
  | { type: 'updateMe'; patch: Partial<Me> }
  | { type: 'setDemoMembers'; n: number }
  | { type: 'addLog'; log: LogEntry }
  | { type: 'updateLog'; id: string; patch: Partial<LogEntry> }
  | { type: 'deleteLog'; id: string }
  | { type: 'toggleWant'; postId: string }
  | { type: 'wantDone'; postId: string }
  | { type: 'setFavorites'; userId: string; niche: NicheId; refs: FavoriteRef[] }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'mapGoal'; id: string; fn: (goal: Goal) => Goal }
  | { type: 'deleteGoal'; id: string }
  | { type: 'addSample'; logs: LogEntry[]; goals: Goal[]; userId: string }
  | { type: 'removeSample' }
  | { type: 'setAppGround'; id: string };

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
    plans: seedPlans(now),
    homeMode: 'feed',
    listings: seedListings(now),
    savedListings: {},
    cart: [],
    orders: [],
    memberships: {},
    unlocks: {},
    creatorApplication: null,
    demoMembers: 0,
    logs: seedLogs(now),
    wantList: {},
    favorites: seedFavorites(),
    goals: seedGoals(now),
    appGround: DEFAULT_APP_GROUND,
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
    // Demo posts whose words changed (v4: one art post now matches its demo photo).
    const freshById = new Map(fresh.posts.map((p) => [p.id, p]));
    merged.posts = merged.posts.map((p) => {
      const f = freshById.get(p.id);
      return f && p.authorId !== merged.me?.id ? { ...p, caption: f.caption, mediaLabel: f.mediaLabel } : p;
    });
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
        // A deleted progress post doesn't undo the progress: its check-in stays, unlinked.
        goals: state.goals.map((g) => (g.checkIns.some((c) => c.postId === action.id) ? { ...g, checkIns: g.checkIns.map((c) => (c.postId === action.id ? { ...c, postId: undefined } : c)) } : g)),
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
    case 'addPlan':
      return { ...state, plans: [...state.plans, action.plan] };
    case 'mapPlan':
      return { ...state, plans: state.plans.map((p) => (p.id === action.id ? action.fn(p) : p)) };
    case 'deletePlan':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };
    case 'setHomeMode':
      return { ...state, homeMode: action.mode };
    case 'toggleSavedListing': {
      const next = { ...state.savedListings };
      if (next[action.id]) delete next[action.id];
      else next[action.id] = true;
      return { ...state, savedListings: next };
    }
    case 'addListing':
      return { ...state, listings: [action.listing, ...state.listings] };
    case 'deleteListing':
      return { ...state, listings: state.listings.filter((l) => l.id !== action.id), cart: state.cart.filter((c) => c.listingId !== action.id) };
    case 'setCart':
      return { ...state, cart: action.cart };
    case 'placeOrders': {
      // Count sales and reduce stock for each listing bought.
      const bought: Record<string, number> = {};
      for (const o of action.orders) for (const l of o.lines) bought[l.listingId] = (bought[l.listingId] ?? 0) + l.qty;
      const listings = state.listings.map((l) =>
        bought[l.id]
          ? { ...l, sold: l.sold + bought[l.id], stock: l.stock === undefined ? undefined : Math.max(0, l.stock - bought[l.id]) }
          : l,
      );
      return { ...state, listings, orders: [...action.orders, ...state.orders] };
    }
    case 'setMembership': {
      const memberships = { ...state.memberships };
      if (action.on) memberships[action.creatorId] = Date.now();
      else delete memberships[action.creatorId];
      return { ...state, memberships };
    }
    case 'unlock':
      return { ...state, unlocks: { ...state.unlocks, [action.postId]: true } };
    case 'setApplication':
      return { ...state, creatorApplication: action.application };
    case 'updateMe':
      return state.me ? { ...state, me: { ...state.me, ...action.patch } } : state;
    case 'addLog':
      return { ...state, logs: [action.log, ...state.logs] };
    case 'updateLog':
      return { ...state, logs: state.logs.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)) };
    case 'deleteLog': {
      // Also drop it from any Top 4 it was in, and remove the goal check-in it made.
      const favorites = { ...state.favorites };
      for (const uid in favorites) {
        const byNiche = { ...favorites[uid] };
        for (const n in byNiche) byNiche[n as NicheId] = byNiche[n as NicheId]!.filter((r) => !(r.kind === 'log' && r.id === action.id));
        favorites[uid] = byNiche;
      }
      const goals = state.goals.map((g) => (g.checkIns.some((c) => c.logId === action.id) ? { ...g, checkIns: g.checkIns.filter((c) => c.logId !== action.id) } : g));
      return { ...state, logs: state.logs.filter((l) => l.id !== action.id), favorites, goals };
    }
    case 'setAppGround':
      return { ...state, appGround: action.id };
    case 'addGoal':
      return { ...state, goals: [action.goal, ...state.goals] };
    case 'mapGoal':
      return { ...state, goals: state.goals.map((g) => (g.id === action.id ? action.fn(g) : g)) };
    case 'deleteGoal':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.id),
        // Progress posts stay, they just aren't linked to a goal anymore.
        posts: state.posts.map((p) => (p.goalId === action.id ? { ...p, goalId: undefined } : p)),
      };
    case 'addSample': {
      const haveLogs = new Set(state.logs.map((l) => l.id));
      const haveGoals = new Set(state.goals.map((g) => g.id));
      const logs = action.logs.filter((l) => !haveLogs.has(l.id));
      const mine = state.favorites[action.userId] ?? {};
      const favorites = mine.cooking?.length ? state.favorites : { ...state.favorites, [action.userId]: { ...mine, cooking: sampleFavorites(action.logs) } };
      return { ...state, logs: [...logs, ...state.logs], goals: [...action.goals.filter((g) => !haveGoals.has(g.id)), ...state.goals], favorites };
    }
    case 'removeSample': {
      const gone = new Set(state.logs.filter((l) => l.sample).map((l) => l.id));
      const favorites = { ...state.favorites };
      for (const uid in favorites) {
        const byNiche = { ...favorites[uid] };
        for (const n in byNiche) byNiche[n as NicheId] = byNiche[n as NicheId]!.filter((r) => !(r.kind === 'log' && gone.has(r.id)));
        favorites[uid] = byNiche;
      }
      return {
        ...state,
        logs: state.logs.filter((l) => !l.sample),
        goals: state.goals.filter((g) => !g.sample).map((g) => ({ ...g, checkIns: g.checkIns.filter((c) => !c.logId || !gone.has(c.logId)) })),
        favorites,
      };
    }
    case 'toggleWant': {
      const wantList = { ...state.wantList };
      if (wantList[action.postId]) delete wantList[action.postId];
      else wantList[action.postId] = Date.now();
      return { ...state, wantList };
    }
    case 'wantDone': {
      if (!state.wantList[action.postId]) return state;
      const wantList = { ...state.wantList };
      delete wantList[action.postId];
      return { ...state, wantList };
    }
    case 'setFavorites':
      return {
        ...state,
        favorites: { ...state.favorites, [action.userId]: { ...state.favorites[action.userId], [action.niche]: action.refs.slice(0, MAX_FAVORITES) } },
      };
    case 'setDemoMembers':
      return { ...state, demoMembers: Math.max(0, action.n) };
    case 'setOrderStatus':
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)) };
  }
}

const isoDayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
      createPlan(input: Omit<Plan, 'id' | 'createdAt' | 'rsvps' | 'dishIdeas' | 'items'> & { items?: string[]; dishIdeas?: string[] }): string {
        const id = makeId('plan');
        const { items = [], dishIdeas = [], ...rest } = input;
        dispatch({
          type: 'addPlan',
          plan: {
            ...rest,
            id,
            createdAt: Date.now(),
            rsvps: {},
            items: items.map((name) => ({ id: makeId('i'), name })),
            dishIdeas: dishIdeas.map((name) => ({ id: makeId('d'), name, by: rest.ownerId, votes: [rest.ownerId] })),
          },
        });
        return id;
      },
      deletePlan: (id: string) => dispatch({ type: 'deletePlan', id }),
      updatePlan: (id: string, patch: Partial<Pick<Plan, 'title' | 'date' | 'time' | 'location' | 'notes' | 'visibility' | 'invitees'>>) =>
        dispatch({ type: 'mapPlan', id, fn: (p) => ({ ...p, ...patch }) }),
      rsvp: (id: string, userId: string, answer: Rsvp | null) =>
        dispatch({
          type: 'mapPlan',
          id,
          fn: (p) => {
            const rsvps = { ...p.rsvps };
            if (answer) rsvps[userId] = answer;
            else delete rsvps[userId];
            return { ...p, rsvps };
          },
        }),
      /** Claim an item ("I'll bring it"), or give it back if you already claimed it. */
      toggleClaim: (id: string, itemId: string, userId: string) =>
        dispatch({
          type: 'mapPlan',
          id,
          fn: (p) => ({
            ...p,
            items: p.items.map((it): PlanItem =>
              it.id !== itemId ? it : it.claimedBy === userId ? { id: it.id, name: it.name } : it.claimedBy ? it : { ...it, claimedBy: userId },
            ),
          }),
        }),
      addItem: (id: string, name: string, claimedBy?: string) =>
        dispatch({ type: 'mapPlan', id, fn: (p) => ({ ...p, items: [...p.items, { id: makeId('i'), name, claimedBy }] }) }),
      removeItem: (id: string, itemId: string) => dispatch({ type: 'mapPlan', id, fn: (p) => ({ ...p, items: p.items.filter((i) => i.id !== itemId) }) }),
      addDishIdea: (id: string, name: string, by: string) =>
        dispatch({ type: 'mapPlan', id, fn: (p) => ({ ...p, dishIdeas: [...p.dishIdeas, { id: makeId('d'), name, by, votes: [by] }] }) }),
      toggleVote: (id: string, ideaId: string, userId: string) =>
        dispatch({
          type: 'mapPlan',
          id,
          fn: (p) => ({
            ...p,
            dishIdeas: p.dishIdeas.map((d): DishIdea =>
              d.id !== ideaId ? d : { ...d, votes: d.votes.includes(userId) ? d.votes.filter((v) => v !== userId) : [...d.votes, userId] },
            ),
          }),
        }),
      setHomeMode: (mode: 'feed' | 'shop') => dispatch({ type: 'setHomeMode', mode }),
      toggleSavedListing: (id: string) => dispatch({ type: 'toggleSavedListing', id }),
      createListing(input: Omit<Listing, 'id' | 'createdAt' | 'sold'>): string {
        const id = makeId('l');
        dispatch({ type: 'addListing', listing: { ...input, id, createdAt: Date.now(), sold: 0 } });
        return id;
      },
      deleteListing: (id: string) => dispatch({ type: 'deleteListing', id }),
      setCart: (cart: CartItem[]) => dispatch({ type: 'setCart', cart }),
      /** Demo checkout: one order per seller, nothing is charged. */
      checkout(buyerId: string, cart: CartItem[], listings: Listing[], shipTo?: string): Order[] {
        const bySeller: Record<string, Order> = {};
        for (const item of cart) {
          const l = listings.find((x) => x.id === item.listingId);
          if (!l) continue;
          const o = (bySeller[l.sellerId] ??= {
            id: makeId('o'),
            buyerId,
            sellerId: l.sellerId,
            lines: [],
            subtotalCents: 0,
            shippingCents: 0,
            feeCents: 0,
            status: 'paid',
            shipTo,
            createdAt: Date.now(),
          });
          o.lines.push({ listingId: l.id, title: l.title, priceCents: l.priceCents, qty: item.qty, format: l.format });
          o.subtotalCents += l.priceCents * item.qty;
          // One shipping charge per item type, like most small shops.
          o.shippingCents += l.format === 'physical' ? (l.shippingCents ?? 0) : 0;
        }
        const orders = Object.values(bySeller).map((o) => ({
          ...o,
          feeCents: feeFor(o.subtotalCents),
          status: o.lines.every((l) => l.format === 'digital') ? ('ready' as const) : ('paid' as const),
        }));
        dispatch({ type: 'placeOrders', orders });
        dispatch({ type: 'setCart', cart: [] });
        return orders;
      },
      /** Demo only: pretend a demo account bought one of your listings. */
      simulateSale(listing: Listing, buyerId: string) {
        const order: Order = {
          id: makeId('o'),
          buyerId,
          sellerId: listing.sellerId,
          lines: [{ listingId: listing.id, title: listing.title, priceCents: listing.priceCents, qty: 1, format: listing.format }],
          subtotalCents: listing.priceCents,
          shippingCents: listing.format === 'physical' ? listing.shippingCents ?? 0 : 0,
          feeCents: feeFor(listing.priceCents),
          status: listing.format === 'digital' ? 'ready' : 'paid',
          shipTo: listing.format === 'physical' ? 'Demo buyer, 123 Example St, Springfield' : undefined,
          createdAt: Date.now(),
        };
        dispatch({ type: 'placeOrders', orders: [order] });
      },
      joinMembership: (creatorId: string) => dispatch({ type: 'setMembership', creatorId, on: true }),
      cancelMembership: (creatorId: string) => dispatch({ type: 'setMembership', creatorId, on: false }),
      unlockPost: (postId: string) => dispatch({ type: 'unlock', postId }),
      applyToCreate: (input: Omit<CreatorApplication, 'status' | 'at'>) =>
        dispatch({ type: 'setApplication', application: { ...input, status: 'pending', at: Date.now() } }),
      /** Demo stand-in for the founder approving an invite. */
      approveMyApplication(application: CreatorApplication | null) {
        dispatch({ type: 'setApplication', application: application ? { ...application, status: 'approved' } : null });
        dispatch({ type: 'updateMe', patch: { membership: { priceCents: 399, tagline: 'Behind the scenes of everything I make', perks: ['Members-only posts', 'Full recipes and process notes'] } } });
      },
      updateMyMembership: (membership: Membership) => dispatch({ type: 'updateMe', patch: { membership } }),
      /** "I made this": log it, and optionally share it as a post too. Returns the entry id. */
      addLog(input: Omit<LogEntry, 'id' | 'createdAt'>, shareAsPost?: { caption: string; imageAspect?: number }, goalIds: string[] = []): string {
        const id = makeId('log');
        let sharedPostId: string | undefined;
        if (shareAsPost) {
          sharedPostId = makeId('p');
          dispatch({
            type: 'addPost',
            post: {
              id: sharedPostId,
              authorId: input.userId,
              niche: input.niche,
              kind: input.imageUri ? 'photo' : 'text',
              caption: shareAsPost.caption,
              imageUri: input.imageUri,
              imageAspect: shareAsPost.imageAspect,
              mediaColor: input.imageUri ? '#E3E5E1' : undefined,
              mediaLabel: input.imageUri ? input.title : undefined,
              createdAt: Date.now(),
            },
          });
        }
        dispatch({ type: 'addLog', log: { ...input, id, createdAt: Date.now(), sharedPostId } });
        // Counting toward goals: one check-in per goal, tied to this entry.
        for (const goalId of goalIds) {
          const checkIn: CheckIn = { id: makeId('ci'), date: input.date, logId: id, postId: sharedPostId, createdAt: Date.now() };
          dispatch({ type: 'mapGoal', id: goalId, fn: (g) => ({ ...g, checkIns: [...g.checkIns, checkIn] }) });
        }
        // Making something takes it off your "Want to make" list.
        if (input.postId) dispatch({ type: 'wantDone', postId: input.postId });
        return id;
      },
      updateLog: (id: string, patch: Partial<LogEntry>) => dispatch({ type: 'updateLog', id, patch }),
      deleteLog: (id: string) => dispatch({ type: 'deleteLog', id }),
      toggleWant: (postId: string) => dispatch({ type: 'toggleWant', postId }),
      setFavorites: (userId: string, niche: NicheId, refs: FavoriteRef[]) => dispatch({ type: 'setFavorites', userId, niche, refs }),
      setAvatar: (avatarUri: string) => dispatch({ type: 'updateMe', patch: { avatarUri } }),
      setDemoMembers: (n: number) => dispatch({ type: 'setDemoMembers', n }),
      setOrderStatus: (id: string, status: OrderStatus) => dispatch({ type: 'setOrderStatus', id, status }),
      chooseDish: (id: string, ideaId: string | undefined) => dispatch({ type: 'mapPlan', id, fn: (p) => ({ ...p, chosenDishId: ideaId }) }),
      addComment(postId: string, authorId: string, text: string) {
        dispatch({ type: 'addComment', comment: { id: makeId('c'), postId, authorId, text, createdAt: Date.now() } });
      },
      createPost(input: { authorId: string; niche: NicheId; kind: PostKind; caption: string; mediaColor?: string; mediaLabel?: string; imageUri?: string; imageAspect?: number; progressLabel?: string; goalId?: string; premium?: boolean; unlockCents?: number }): string {
        const id = makeId('p');
        dispatch({ type: 'addPost', post: { id, createdAt: Date.now(), ...input } });
        // A progress post toward a goal counts as a check-in.
        if (input.goalId) {
          const checkIn: CheckIn = { id: makeId('ci'), date: isoDayLocal(), postId: id, createdAt: Date.now() };
          dispatch({ type: 'mapGoal', id: input.goalId, fn: (g) => ({ ...g, checkIns: [...g.checkIns, checkIn] }) });
        }
        return id;
      },
      createGoal(input: Omit<Goal, 'id' | 'createdAt' | 'checkIns' | 'restWeeks'>): string {
        const id = makeId('goal');
        dispatch({ type: 'addGoal', goal: { ...input, id, createdAt: Date.now(), checkIns: [], restWeeks: [] } });
        return id;
      },
      updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'perWeek' | 'target' | 'unit' | 'start' | 'visibility' | 'hideNumbers'>>) =>
        dispatch({ type: 'mapGoal', id, fn: (g) => ({ ...g, ...patch }) }),
      deleteGoal: (id: string) => dispatch({ type: 'deleteGoal', id }),
      checkIn: (goalId: string, input: Omit<CheckIn, 'id' | 'createdAt'>) =>
        dispatch({ type: 'mapGoal', id: goalId, fn: (g) => ({ ...g, checkIns: [...g.checkIns, { ...input, id: makeId('ci'), createdAt: Date.now() }] }) }),
      removeCheckIn: (goalId: string, checkInId: string) =>
        dispatch({ type: 'mapGoal', id: goalId, fn: (g) => ({ ...g, checkIns: g.checkIns.filter((c) => c.id !== checkInId) }) }),
      /** Rest weeks keep a habit streak alive. Tap again to undo. */
      toggleRestWeek: (goalId: string, week: string) =>
        dispatch({ type: 'mapGoal', id: goalId, fn: (g) => ({ ...g, restWeeks: g.restWeeks.includes(week) ? g.restWeeks.filter((w) => w !== week) : [...g.restWeeks, week] }) }),
      setGoalDone: (goalId: string, done: boolean) =>
        dispatch({ type: 'mapGoal', id: goalId, fn: (g) => ({ ...g, doneAt: done ? Date.now() : undefined }) }),
      /** Demo: fill your diary with a year of sample entries and two goals. */
      addSampleYear(userId: string) {
        const { logs, goals } = sampleYear(userId);
        dispatch({ type: 'addSample', logs, goals, userId });
      },
      removeSampleYear: () => dispatch({ type: 'removeSample' }),
      setAppGround: (id: string) => dispatch({ type: 'setAppGround', id }),
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

/** The app background for non-niche screens (Cream unless changed in the Color lab). */
export function useAppGround() {
  return appGround(useStore().state.appGround);
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

/** Whether this viewer can see a post's full content (members-only posts are locked otherwise). */
export function hasAccess(state: State, post: Post) {
  if (!post.premium) return true;
  return post.authorId === state.me?.id || !!state.memberships[post.authorId] || !!state.unlocks[post.id];
}

/** Diary entries a viewer can see for a user: all of your own, or someone else's profile-visible ones. */
export function visibleLogs(state: State, userId: string) {
  const mine = userId === state.me?.id;
  return state.logs.filter((l) => l.userId === userId && (mine || l.visibility === 'profile')).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

/**
 * Whether a post appears in niche feeds and Discover for this viewer.
 * Members-only posts show there only to people who can open them; everyone
 * else finds them on the creator's profile (founder decision, Nov 2026).
 */
export function inFeeds(state: State, post: Post) {
  return isVisible(state, post) && hasAccess(state, post);
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
    .filter((p) => allowed.has(p.niche) && inFeeds(state, p) && now - p.createdAt < WEEK_MS && p.authorId !== state.me?.id)
    .map((p) => ({ post: p, score: postStats(state, p).saves }))
    .sort((a, b) => b.score - a.score || b.post.createdAt - a.post.createdAt)
    .map((x) => x.post);
}
