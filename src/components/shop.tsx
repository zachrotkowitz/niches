import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { NICHE_BORDER } from '@/components/feed-grid';
import { BagIcon, BookmarkIcon, CheckIcon, ChevronLeftIcon, DownloadIcon, SearchIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { useSwipeBlocked, useSwipeExempt } from '@/components/niche-swipe';
import { DisplayText } from '@/components/primitives';
import { averageRating, CATEGORIES, formatPrice, type Listing, type Review } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { listingPhoto } from '@/lib/demo-photos';
import { colors, fonts, TOUCH, type Niche } from '@/lib/theme';

const HEIGHTS = [210, 170, 240, 190, 220, 180];
function listingHeight(l: Listing) {
  let h = 0;
  for (let i = 0; i < l.id.length; i++) h = (h * 31 + l.id.charCodeAt(i)) >>> 0;
  return HEIGHTS[h % HEIGHTS.length];
}

/** A listing tile: image, price tag, title, seller. `nicheBorder` outlines it on mixed-niche screens. */
export function ListingTile({ listing, nicheBorder = false }: { listing: Listing; nicheBorder?: boolean }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[listing.niche];
  const swiping = useSwipeBlocked();
  const saved = !!state.savedListings[listing.id];
  const height = listingHeight(listing);
  const inset = nicheBorder ? NICHE_BORDER : 0;
  const soldOut = listing.stock === 0;

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${listing.title}, ${formatPrice(listing.priceCents)}${listing.format === 'digital' ? ', digital' : ''}${soldOut ? ', sold out' : ''}, from ${usersById[listing.sellerId]?.username ?? 'a seller'}`}
        onPress={() => !swiping() && router.push({ pathname: '/shop/[id]', params: { id: listing.id } })}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <View style={[{ height, borderRadius: nicheBorder ? 18 : 16, overflow: 'hidden', backgroundColor: listing.mediaColor }, nicheBorder ? { borderWidth: NICHE_BORDER, borderColor: niche.accent } : null]}>
          {listingPhoto(listing) ? <Image source={listingPhoto(listing)} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Photo: ${listing.title}`} /> : null}
          <View style={styles.price}>
            <Text style={styles.priceText}>{formatPrice(listing.priceCents)}</Text>
          </View>
          {listing.format === 'digital' ? (
            <View style={styles.digital}>
              <DownloadIcon size={11} color="#FFFFFF" />
              <Text style={styles.digitalText}>Digital</Text>
            </View>
          ) : null}
          {soldOut ? (
            <View style={styles.soldOut}>
              <Text style={styles.soldOutText}>Sold out</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.seller} numberOfLines={1}>{usersById[listing.sellerId]?.username}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Saved' : 'Save'}
        accessibilityState={{ selected: saved }}
        onPress={() => !swiping() && actions.toggleSavedListing(listing.id)}
        hitSlop={4}
        style={[styles.save, { top: height - 46 - inset, right: 6 + inset, backgroundColor: saved ? niche.accent : 'rgba(255,255,255,0.94)' }]}>
        <BookmarkIcon size={17} filled={saved} color={saved ? '#FFFFFF' : colors.text} />
      </Pressable>
    </View>
  );
}

/** Two-column grid of listings, balanced like the post grid. */
export function ListingGrid({ listings, nicheBorders = false }: { listings: Listing[]; nicheBorders?: boolean }) {
  const cols: Listing[][] = [[], []];
  const heights = [0, 0];
  for (const l of listings) {
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(l);
    heights[i] += listingHeight(l) + 60;
  }
  return (
    <View style={styles.row}>
      {cols.map((col, i) => (
        <View key={i} style={styles.col}>
          {col.map((l) => (
            <ListingTile key={l.id} listing={l} nicheBorder={nicheBorders} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** The "Shop this" bar under a post that has a listing attached. */
export function ShopThisBar({ postId }: { postId: string }) {
  const router = useRouter();
  const { state } = useStore();
  const niches = useNiches();
  const swiping = useSwipeBlocked();
  const listing = state.listings.find((l) => l.linkedPostId === postId);
  if (!listing) return null;
  const niche = niches[listing.niche];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Shop this: ${listing.title}, ${formatPrice(listing.priceCents)}`}
      onPress={() => !swiping() && router.push({ pathname: '/shop/[id]', params: { id: listing.id } })}
      style={({ pressed }) => [styles.shopThis, { backgroundColor: niche.field, opacity: pressed ? 0.85 : 1 }]}>
      <BagIcon size={18} color={niche.ink} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.shopThisLabel, { color: niche.inkSoft }]}>Shop this</Text>
        <Text style={[styles.shopThisTitle, { color: niche.ink }]} numberOfLines={1}>{listing.title}</Text>
      </View>
      <Text style={[styles.shopThisPrice, { color: niche.ink }]}>{formatPrice(listing.priceCents)}</Text>
    </Pressable>
  );
}

const WEEK = 7 * 24 * 3600 * 1000;

/** Which listings a shelf (or its "See all" page) shows. Shared by Home's shop and /shop/browse. */
export function shelfListings(listings: Listing[], following: Record<string, boolean>, section: string): { title: string; items: Listing[] } {
  const followed = listings.filter((l) => following[l.sellerId]).sort((a, b) => b.createdAt - a.createdAt);
  if (section === 'best') return { title: 'Best sellers', items: [...listings].sort((a, b) => b.sold - a.sold) };
  // Only shown when you follow someone who sells in this niche.
  if (section === 'following') return { title: 'From people you follow', items: followed };
  if (section === 'new') {
    const newest = [...listings].sort((a, b) => b.createdAt - a.createdAt);
    const week = newest.filter((l) => Date.now() - l.createdAt < WEEK);
    return week.length >= 2 ? { title: 'New this week', items: week } : { title: 'New lately', items: newest };
  }
  return { title: 'Everything', items: [...listings].sort((a, b) => b.createdAt - a.createdAt) };
}

/** One item on a shelf: photo, title, price. */
function ShelfItem({ listing }: { listing: Listing }) {
  const router = useRouter();
  const swiping = useSwipeBlocked();
  const surface = useSurface();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.priceCents)}`}
      onPress={() => !swiping() && router.push({ pathname: '/shop/[id]', params: { id: listing.id } })}
      style={({ pressed }) => [styles.shelfItem, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={[styles.shelfPhoto, { backgroundColor: listing.mediaColor }]}>
        {listingPhoto(listing) ? <Image source={listingPhoto(listing)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        {listing.format === 'digital' ? (
          <View style={styles.digital}>
            <DownloadIcon size={11} color="#FFFFFF" />
            <Text style={styles.digitalText}>Digital</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.shelfTitle, { color: surface.text }]} numberOfLines={2}>{listing.title}</Text>
      <Text style={[styles.shelfPrice, { color: surface.text }]}>{formatPrice(listing.priceCents)}</Text>
    </Pressable>
  );
}

/**
 * A niche's shop on Home (founder, Nov 20 2026: B's shelves; "See all" opens
 * A's Etsy-style grid): a search bar, then shelves you scroll sideways,
 * Best sellers, New this week, From people you follow, then every listing
 * in a two-across grid that ends.
 */
export function NicheShop({ niche }: { niche: Niche }) {
  const router = useRouter();
  const { state } = useStore();
  const swiping = useSwipeBlocked();
  const surface = useSurface();
  const listings = state.listings.filter((l) => l.niche === niche.id);
  const go = (section: string) => !swiping() && router.push({ pathname: '/shop/browse', params: { niche: niche.id, section } });
  // Swiping a shelf scrolls it; swiping anywhere else goes back to the feed.
  const exempt = useSwipeExempt();

  if (!listings.length)
    return (
      <View style={[styles.empty, { backgroundColor: niche.field }]}>
        <DisplayText size={22} color={niche.ink}>Nothing for sale yet</DisplayText>
        <Text style={[styles.emptyBody, { color: niche.inkSoft }]}>Be the first to list something in {niche.label}.</Text>
      </View>
    );

  return (
    <View style={{ paddingTop: 6 }}>
      <Pressable accessibilityRole="search" accessibilityLabel={`Search the ${niche.label} shop`} onPress={() => go('search')} style={styles.searchBar}>
        <SearchIcon size={18} color={colors.textMuted} />
        <Text style={styles.searchText} numberOfLines={1}>Search the {niche.label} shop</Text>
      </Pressable>
      {/* Same order in every niche's shop (founder, Nov 21 2026): best sellers, what's new, then people you follow. */}
      {(['best', 'new', 'following'] as const).map((key) => {
        const shelf = shelfListings(listings, state.following, key);
        if (!shelf.items.length) return null;
        return (
          <View key={key} style={styles.shelf}>
            <View style={styles.shelfHead}>
              <Text style={[styles.shelfName, { color: surface.text }]}>{shelf.title}</Text>
              <Pressable accessibilityRole="link" accessibilityLabel={`See all: ${shelf.title}`} onPress={() => go(key)} hitSlop={8}>
                <Text style={[styles.seeAll, { color: surface.text }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow} {...exempt}>
              {shelf.items.slice(0, 8).map((l) => (
                <ShelfItem key={l.id} listing={l} />
              ))}
            </ScrollView>
          </View>
        );
      })}
      {/* Everything, newest first, as A's two-across grid that simply ends (founder, Nov 21 2026; replaces the "See every listing" link). */}
      <EverythingGrid niche={niche} listings={listings} reviews={state.reviews} />
      {niche.id === 'cooking' ? <Text style={[styles.end, { color: surface.muted }]}>Food can’t be sold on Niches; recipes and cookbooks can.</Text> : <View style={{ height: 24 }} />}
    </View>
  );
}

/** About how tall the open menu is; with less grid than this below the heading it opens upward. */
const MENU_HEIGHT = 340;
/** The floating tab bar and the space around it at the bottom of the screen. */
const TAB_BAR_ROOM = 100;

type Sort = 'new' | 'top' | 'priceUp' | 'priceDown';
type Show = 'all' | 'digital' | 'physical';
const SORTS: { key: Exclude<Sort, 'new'>; label: string; short: string }[] = [
  { key: 'top', label: 'Top rated', short: 'Top rated' },
  { key: 'priceUp', label: 'Price: low to high', short: 'Price ↑' },
  { key: 'priceDown', label: 'Price: high to low', short: 'Price ↓' },
];
const SHOWS: { key: Show; label: string; short: string }[] = [
  { key: 'all', label: 'Everything', short: '' },
  { key: 'digital', label: 'Digital downloads', short: 'Digital' },
  { key: 'physical', label: 'Ships to you', short: 'Ships' },
];

/** Sort and filter for the Everything grid, then the grid. */
export function sortListings(listings: Listing[], reviews: Review[], sort: Sort, show: Show): Listing[] {
  let out = listings.filter((l) => show === 'all' || (show === 'digital' ? l.format === 'digital' : l.format === 'physical'));
  if (sort === 'top') {
    // Top rated = 4 stars and up (founder, Nov 21 2026), best first; reviews switched off don't count.
    const rated = out
      .map((l) => ({ l, r: l.reviewsOff ? 0 : averageRating(reviews.filter((x) => x.listingId === l.id)) }))
      .filter((x) => x.r >= 4);
    return rated.sort((a, b) => b.r - a.r || b.l.createdAt - a.l.createdAt).map((x) => x.l);
  }
  out = [...out].sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'priceUp') out.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === 'priceDown') out.sort((a, b) => b.priceCents - a.priceCents);
  return out;
}

/**
 * "Everything in Cooking" with one quiet word at the right, "Sort ▾" (founder
 * picked option A, Nov 21 2026; canvas page "Shop"). It opens a small white
 * menu like the niche switcher: Sort (Top rated, Price up, Price down; no
 * Newest or Best sellers since the shelves cover those) and Show (Everything,
 * Digital downloads, Ships to you). With nothing picked it's newest first.
 */
function EverythingGrid({ niche, listings, reviews }: { niche: Niche; listings: Listing[]; reviews: Review[] }) {
  const surface = useSurface();
  const [sort, setSort] = useState<Sort>('new');
  const [show, setShow] = useState<Show>('all');
  const [open, setOpen] = useState(false);
  // Where the Sort word is on screen, so the menu can sit next to it in a
  // full-screen layer: a tap anywhere outside closes it (founder, Nov 23 2026).
  const wordRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const win = useWindowDimensions();
  const toggle = () => {
    if (open) return setOpen(false);
    wordRef.current?.measureInWindow((x, y, w, h) => (setAnchor({ x, y, w, h }), setOpen(true)));
  };
  // Short on room below (above the tab bar): open upward instead (founder, Nov 23 2026).
  const up = !!anchor && win.height - (anchor.y + anchor.h) - TAB_BAR_ROOM < MENU_HEIGHT;
  const items = sortListings(listings, reviews, sort, show);
  const picked = [SORTS.find((x) => x.key === sort)?.short, SHOWS.find((x) => x.key === show)?.short].filter(Boolean).join(', ');
  const clear = () => (setSort('new'), setShow('all'));
  const row = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="menuitem" accessibilityState={{ selected: on }} onPress={() => (onPress(), setOpen(false))} style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.menuText, { fontWeight: on ? '700' : '500' }]}>{label}</Text>
      {on ? <CheckIcon size={17} color={niche.ink} /> : null}
    </Pressable>
  );
  return (
    <View style={styles.everything}>
      <View style={styles.everythingHead}>
        <Text accessibilityRole="header" style={[styles.shelfName, { color: surface.text, flexShrink: 1 }]}>
          Everything in <Text style={{ fontFamily: fonts.displayItalic }}>{niche.label}</Text>
        </Text>
        <View ref={wordRef} collapsable={false}>
        <Pressable accessibilityRole="button" accessibilityLabel={picked ? `Sort and filter: ${picked}` : 'Sort and filter'} accessibilityState={{ expanded: open }} onPress={toggle} hitSlop={10} style={styles.sortWord}>
          <Text style={[styles.sortText, { color: surface.text }]}>{picked || 'Sort'}</Text>
          <View style={{ transform: [{ rotate: open ? '90deg' : '-90deg' }] }}>
            <ChevronLeftIcon size={15} color={surface.text} />
          </View>
        </Pressable>
        </View>
      </View>
      {picked && !open ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear sort and filter" onPress={clear} hitSlop={8} style={styles.clear}>
          <Text style={[styles.clearText, { color: surface.muted }]}>Clear</Text>
        </Pressable>
      ) : null}
      <View style={{ marginHorizontal: -20 }}>
        {items.length ? (
          <ListingGrid listings={items} />
        ) : (
          <Text style={[styles.none, { color: surface.muted }]}>No results available</Text>
        )}
      </View>
      <Modal visible={open && !!anchor} transparent animationType="none" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        {/* Tap anywhere to close; nothing is dimmed (founder). */}
        <Pressable accessibilityLabel="Close menu" onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
        {anchor ? (
          <View
            accessibilityRole="menu"
            style={[styles.menu, { right: Math.max(12, win.width - (anchor.x + anchor.w)) }, up ? { bottom: win.height - anchor.y + 8 } : { top: anchor.y + anchor.h + 8 }]}>
            <Text style={styles.menuLabel}>SORT</Text>
            {SORTS.map((x) => row(x.label, sort === x.key, () => setSort(sort === x.key ? 'new' : x.key)))}
            <View style={styles.menuRule} />
            <Text style={styles.menuLabel}>SHOW</Text>
            {SHOWS.map((x) => row(x.label, show === x.key, () => setShow(x.key)))}
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 12, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0, gap: 14 },
  price: { position: 'absolute', left: 8, top: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  priceText: { fontSize: 14, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  digital: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(20,22,26,0.78)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  digitalText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  soldOut: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  soldOutText: { fontSize: 15, fontWeight: '800', color: colors.text },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: colors.text, marginTop: 6, paddingHorizontal: 2 },
  seller: { fontSize: 12, color: colors.textMuted, marginTop: 2, paddingHorizontal: 2 },
  save: { position: 'absolute', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  shopThis: { marginHorizontal: 20, marginTop: 10, minHeight: TOUCH + 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopThisLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  shopThisTitle: { fontSize: 14, fontWeight: '600' },
  shopThisPrice: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  shopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 10, paddingTop: 6 },
  shopMeta: { flex: 1, fontSize: 13, color: colors.textMuted },
  cartButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 4 },
  empty: { margin: 20, padding: 20, borderRadius: 20, gap: 8 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  searchBar: { marginHorizontal: 20, minHeight: 46, borderRadius: 23, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  searchText: { fontSize: 15, color: colors.textMuted, flexShrink: 1 },
  shelf: { marginTop: 22, gap: 10 },
  shelfHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20 },
  shelfName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  seeAll: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  shelfRow: { gap: 12, paddingHorizontal: 20 },
  shelfItem: { width: 150, gap: 5 },
  shelfPhoto: { height: 172, borderRadius: 16, overflow: 'hidden' },
  shelfTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  shelfPrice: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  everything: { marginTop: 30, paddingHorizontal: 20 },
  everythingHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  sortWord: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 32 },
  sortText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  clear: { alignSelf: 'flex-end', paddingTop: 2 },
  clearText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  none: { fontSize: 15, lineHeight: 21, paddingHorizontal: 20, paddingTop: 16 },
  menu: { position: 'absolute', width: 236, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#123D2A', shadowOpacity: 0.18, shadowRadius: 17, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  menuLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, color: colors.textMuted, paddingTop: 4 },
  menuRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuText: { fontSize: 15, color: colors.text },
  menuRule: { height: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(31,26,20,0.12)', marginVertical: 6 },
  end: { textAlign: 'center', fontSize: 12, lineHeight: 17, paddingHorizontal: 32, paddingVertical: 18 },
});
