import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NICHE_BORDER } from '@/components/feed-grid';
import { BagIcon, BookmarkIcon, DownloadIcon } from '@/components/icons';
import { useSwipeBlocked } from '@/components/niche-swipe';
import { Button, DisplayText } from '@/components/primitives';
import { CATEGORIES, formatPrice, type Listing } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH, type Niche } from '@/lib/theme';

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
          {listing.imageUri ? <Image source={{ uri: listing.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Photo: ${listing.title}`} /> : null}
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

/** A niche's shop, shown on Home when the Feed/Shop switch is on Shop. */
export function NicheShop({ niche }: { niche: Niche }) {
  const router = useRouter();
  const { state } = useStore();
  const swiping = useSwipeBlocked();
  const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);
  const listings = state.listings.filter((l) => l.niche === niche.id).sort((a, b) => b.createdAt - a.createdAt);
  const cats = CATEGORIES[niche.id] ?? [];

  return (
    <View>
      <View style={styles.shopBar}>
        <Text style={styles.shopMeta}>{listings.length} {listings.length === 1 ? 'listing' : 'listings'} · {cats.slice(0, 3).join(', ').toLowerCase()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${cartCount} items`} onPress={() => !swiping() && router.push('/shop/cart')} style={styles.cartButton}>
          <BagIcon size={20} color={colors.text} />
          {cartCount ? (
            <View style={[styles.badge, { backgroundColor: niche.accent }]}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Button label="Sell something" color={niche.accent} style={{ flex: 1 }} onPress={() => !swiping() && router.push({ pathname: '/shop/new', params: { niche: niche.id } })} />
        <Button label="Your orders" tone="outline" style={{ flex: 1 }} onPress={() => !swiping() && router.push('/shop/orders')} />
      </View>
      {listings.length ? (
        <ListingGrid listings={listings} />
      ) : (
        <View style={[styles.empty, { backgroundColor: niche.field }]}>
          <DisplayText size={22} color={niche.ink}>Nothing for sale yet</DisplayText>
          <Text style={[styles.emptyBody, { color: niche.inkSoft }]}>Be the first to list something in {niche.label}.</Text>
        </View>
      )}
      <Text style={styles.end}>That’s every listing in {niche.label}. Food can’t be sold on Niches; recipes and cookbooks can.</Text>
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
  end: { textAlign: 'center', fontSize: 13, lineHeight: 18, color: colors.textMuted, paddingHorizontal: 32, paddingVertical: 24 },
});
