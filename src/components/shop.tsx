import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { NICHE_BORDER } from '@/components/feed-grid';
import { BagIcon, BookmarkIcon, DownloadIcon, SearchIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { useSwipeBlocked } from '@/components/niche-swipe';
import { DisplayText } from '@/components/primitives';
import { CATEGORIES, formatPrice, type Listing } from '@/lib/shop';
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
  if (section === 'following') {
    // Follow nobody yet? Show the best sellers instead, so the shelf is never empty.
    return followed.length ? { title: 'From people you follow', items: followed } : { title: 'Best sellers', items: [...listings].sort((a, b) => b.sold - a.sold) };
  }
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
 * From people you follow and New this week, and a link to every listing.
 */
export function NicheShop({ niche }: { niche: Niche }) {
  const router = useRouter();
  const { state } = useStore();
  const swiping = useSwipeBlocked();
  const surface = useSurface();
  const listings = state.listings.filter((l) => l.niche === niche.id);
  const go = (section: string) => !swiping() && router.push({ pathname: '/shop/browse', params: { niche: niche.id, section } });

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
      {(['following', 'new'] as const).map((key) => {
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow}>
              {shelf.items.slice(0, 8).map((l) => (
                <ShelfItem key={l.id} listing={l} />
              ))}
            </ScrollView>
          </View>
        );
      })}
      <Pressable accessibilityRole="link" onPress={() => go('all')} style={styles.everything}>
        <Text style={[styles.everythingText, { color: surface.text }]}>
          See every listing in {niche.label} <Text style={{ color: surface.muted, textDecorationLine: 'none' }}>· {listings.length}</Text>
        </Text>
      </Pressable>
      <Text style={[styles.end, { color: surface.muted }]}>Food can’t be sold on Niches; recipes and cookbooks can.</Text>
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
  everything: { marginTop: 26, marginHorizontal: 20, minHeight: TOUCH, justifyContent: 'center' },
  everythingText: { fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  end: { textAlign: 'center', fontSize: 12, lineHeight: 17, paddingHorizontal: 32, paddingVertical: 18 },
});
