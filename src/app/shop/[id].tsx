import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BagIcon, BookmarkIcon, ChevronLeftIcon, DownloadIcon, MoreIcon } from '@/components/icons';
import { Avatar, Button, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { ListingGrid } from '@/components/shop';
import { useToast } from '@/components/toast';
import { SEED_USERS } from '@/lib/seed';
import { FEE_RATE, feeFor, formatLine, formatPrice } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [qty, setQty] = useState(1);
  const [menu, setMenu] = useState(false);

  const listing = state.listings.find((l) => l.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!listing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }]}>
        <Text style={{ fontSize: 17, color: colors.text }}>This listing isn’t available anymore.</Text>
        <Button label="Go back" onPress={goBack} />
      </View>
    );
  }

  const niche = niches[listing.niche];
  const seller = usersById[listing.sellerId];
  const isMine = listing.sellerId === state.me?.id;
  const saved = !!state.savedListings[listing.id];
  const inCart = state.cart.find((c) => c.listingId === listing.id);
  const soldOut = listing.stock === 0;
  const maxQty = listing.format === 'digital' ? 1 : listing.stock ?? 10;
  const post = listing.linkedPostId ? state.posts.find((p) => p.id === listing.linkedPostId) : undefined;
  const more = state.listings.filter((l) => l.sellerId === listing.sellerId && l.id !== listing.id);

  const addToCart = (andGo: boolean) => {
    const cart = state.cart.filter((c) => c.listingId !== listing.id);
    actions.setCart([...cart, { listingId: listing.id, qty: Math.min(maxQty, (inCart?.qty ?? 0) + qty) }]);
    if (andGo) router.push('/shop/cart');
    else toast('Added to your cart');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.iconButton}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <View style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${state.cart.reduce((n, c) => n + c.qty, 0)} items`} onPress={() => router.push('/shop/cart')} style={styles.iconButton}>
            <BagIcon color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Listing options" onPress={() => setMenu(true)} style={styles.iconButton}>
            <MoreIcon color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={`Photo: ${listing.mediaLabel}`} style={[styles.hero, { backgroundColor: listing.mediaColor }]}>
          <View style={styles.heroLabel}>
            <Text style={styles.heroLabelText}>Photo · {listing.mediaLabel}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.category, { color: niche.ink, backgroundColor: niche.field }]}>
            {niche.label} · {listing.category}
          </Text>
          <DisplayText size={28}>{listing.title}</DisplayText>
          <Text style={styles.price}>{formatPrice(listing.priceCents)}</Text>
          <View style={styles.formatRow}>
            {listing.format === 'digital' ? <DownloadIcon size={15} color={colors.textSecondary} /> : null}
            <Text style={styles.formatText}>
              {formatLine(listing)}
              {listing.format === 'physical' && listing.stock !== undefined ? ` · ${listing.stock === 0 ? 'sold out' : `${listing.stock} left`}` : listing.format === 'physical' ? ' · made to order' : ''}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Seller: ${seller?.displayName}`}
            onPress={() => (isMine ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: listing.sellerId } }))}
            style={styles.seller}>
            <Avatar user={seller} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{isMine ? 'Your listing' : seller?.displayName}</Text>
              <Text style={styles.sellerSub}>{seller?.username} · {listing.sold} sold</Text>
            </View>
          </Pressable>

          <Text style={styles.description}>{listing.description}</Text>

          {post ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })} style={styles.fromPost}>
              <View style={{ width: 64, borderRadius: 10, overflow: 'hidden' }}>
                <MediaPlaceholder post={post} height={64} showLabel={false} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.fromPostLabel}>From the post</Text>
                <Text style={styles.fromPostText} numberOfLines={2}>{post.caption}</Text>
              </View>
            </Pressable>
          ) : null}

          {isMine ? (
            <View style={[styles.sellerBox, { backgroundColor: niche.field }]}>
              <Text style={[styles.sellerBoxTitle, { color: niche.ink }]}>You earn {formatPrice(listing.priceCents - feeFor(listing.priceCents))} per sale</Text>
              <Text style={[styles.sellerBoxBody, { color: niche.inkSoft }]}>
                Niches keeps {Math.round(FEE_RATE * 100)}% ({formatPrice(feeFor(listing.priceCents))}). Buyers pay the price plus shipping, with no extra fees.
              </Text>
              <Button
                tone="inverse"
                color={niche.ink}
                label="Demo: simulate a sale"
                onPress={() => {
                  const buyer = SEED_USERS[Math.floor(Math.random() * SEED_USERS.length)];
                  actions.simulateSale(listing, buyer.id);
                  toast(`${buyer.username} bought it (demo). See Your orders → Sales.`);
                }}
              />
            </View>
          ) : null}
        </View>

        {more.length ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.moreTitle}>More from {isMine ? 'your shop' : seller?.username}</Text>
            <ListingGrid listings={more} />
          </View>
        ) : null}
      </ScrollView>

      {isMine ? null : (
        <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Saved' : 'Save'}
            accessibilityState={{ selected: saved }}
            onPress={() => actions.toggleSavedListing(listing.id)}
            style={[styles.saveButton, saved ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>
            <BookmarkIcon size={20} filled={saved} color={saved ? '#FFFFFF' : colors.text} />
          </Pressable>
          {listing.format === 'physical' && !soldOut ? (
            <View style={styles.stepper} accessibilityLabel={`Quantity ${qty}`}>
              <Pressable accessibilityRole="button" accessibilityLabel="Fewer" disabled={qty <= 1} onPress={() => setQty(qty - 1)} style={styles.step}>
                <Text style={[styles.stepText, { opacity: qty <= 1 ? 0.3 : 1 }]}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="More" disabled={qty >= maxQty} onPress={() => setQty(qty + 1)} style={styles.step}>
                <Text style={[styles.stepText, { opacity: qty >= maxQty ? 0.3 : 1 }]}>+</Text>
              </Pressable>
            </View>
          ) : null}
          {soldOut ? (
            <Button label="Sold out" disabled style={{ flex: 1 }} color={colors.textMuted} />
          ) : listing.format === 'digital' && inCart ? (
            <Button label="In your cart" style={{ flex: 1 }} color={niche.accent} onPress={() => router.push('/shop/cart')} />
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <Button label="Add to cart" tone="outline" style={{ flex: 1, paddingHorizontal: 8 }} onPress={() => addToCart(false)} />
              <Button label="Buy now" color={niche.accent} style={{ flex: 1, paddingHorizontal: 8 }} onPress={() => addToCart(true)} />
            </View>
          )}
        </View>
      )}

      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        items={
          isMine
            ? [
                {
                  label: 'Delete listing',
                  destructive: true,
                  detail: 'Removes it from the shop. Past orders stay in Your orders.',
                  onPress: () => {
                    setMenu(false);
                    actions.deleteListing(listing.id);
                    toast('Listing deleted');
                    goBack();
                  },
                },
              ]
            : [
                { label: saved ? 'Remove from saved' : 'Save', onPress: () => { setMenu(false); actions.toggleSavedListing(listing.id); toast(saved ? 'Removed from saved' : 'Saved'); } },
                { label: 'Report listing', destructive: true, detail: 'Food for sale, stolen work, scams or anything else that breaks the rules.', onPress: () => { setMenu(false); toast('Thanks. We’ll review this listing.'); } },
              ]
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, backgroundColor: colors.ground },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 340, justifyContent: 'flex-end' },
  heroLabel: { margin: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  heroLabelText: { fontSize: 12, fontWeight: '500', color: colors.text },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  category: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  price: { fontSize: 24, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  formatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formatText: { fontSize: 14, color: colors.textSecondary, flexShrink: 1 },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hairline, marginTop: 4 },
  sellerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  sellerSub: { fontSize: 13, color: colors.textMuted },
  description: { fontSize: 15, lineHeight: 22, color: colors.textBody },
  fromPost: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, backgroundColor: colors.surface },
  fromPostLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  fromPostText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  sellerBox: { padding: 16, borderRadius: 16, gap: 8, marginTop: 4 },
  sellerBoxTitle: { fontSize: 16, fontWeight: '700' },
  sellerBoxBody: { fontSize: 14, lineHeight: 20 },
  moreTitle: { fontSize: 18, fontWeight: '700', color: colors.text, paddingHorizontal: 20 },
  buyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.ground, borderTopWidth: 1, borderTopColor: colors.hairline },
  saveButton: { width: TOUCH + 4, height: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, height: TOUCH + 4 },
  step: { width: 34, height: TOUCH + 4, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, fontWeight: '600', color: colors.text },
  qty: { minWidth: 18, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
});
