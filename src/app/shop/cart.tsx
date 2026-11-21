import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckoutSheet } from '@/components/checkout-sheet';
import { ChevronLeftIcon } from '@/components/icons';
import { Avatar, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { listingPhoto } from '@/lib/demo-photos';
import { FEE_RATE, formatPrice, type CartItem, type Listing } from '@/lib/shop';
import { useAppGround, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

/**
 * Your cart, in the new shop style (founder, Nov 21 2026): a masthead, items
 * grouped by seller on white cards (photo, serif title, delivery, − qty +,
 * Remove), a white total card, and one Checkout bar that opens the same
 * one-sheet checkout as Buy now.
 */
export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const ground = groundSurface(useAppGround());
  const [paying, setPaying] = useState(false);

  const lines = state.cart
    .map((c) => ({ item: c, listing: state.listings.find((l) => l.id === c.listingId) }))
    .filter((x): x is { item: CartItem; listing: Listing } => !!x.listing);
  const sellers = [...new Set(lines.map((x) => x.listing.sellerId))];
  const subtotal = lines.reduce((n, x) => n + x.listing.priceCents * x.item.qty, 0);
  const shipping = lines.reduce((n, x) => n + (x.listing.format === 'physical' ? x.listing.shippingCents ?? 0 : 0), 0);
  const count = lines.reduce((n, x) => n + x.item.qty, 0);
  const setQty = (listingId: string, qty: number) =>
    actions.setCart(qty <= 0 ? state.cart.filter((c) => c.listingId !== listingId) : state.cart.map((c) => (c.listingId === listingId ? { ...c, qty } : c)));
  const row = (label: string, value: string, bold = false) => (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, { color: bold ? ground.text : ground.muted, fontWeight: bold ? '800' : '400' }]}>{label}</Text>
      <Text style={[styles.sumValue, { color: ground.text, fontWeight: bold ? '800' : '600' }]}>{value}</Text>
    </View>
  );

  return (
    <SurfaceProvider value={ground}>
      <View style={{ flex: 1, backgroundColor: ground.ground }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 120, paddingHorizontal: 20, gap: 14 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
            <ChevronLeftIcon color={ground.text} />
          </Pressable>
          <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
            <DisplayText size={42} color={ground.text}>Your cart</DisplayText>
            {count ? <Text style={[styles.count, { color: ground.muted }]}>{count} {count === 1 ? 'item' : 'items'}</Text> : null}
          </View>

          {!lines.length ? (
            <View style={{ gap: 4, paddingTop: 8 }}>
              <Text style={[styles.emptyTitle, { color: ground.text }]}>Your cart is empty.</Text>
              <Pressable accessibilityRole="link" onPress={() => (actions.setHomeMode('shop'), router.navigate('/'))} style={styles.linkHit}>
                <Text style={[styles.emptyBody, { color: ground.muted }]}>
                  Cookbooks, prints and artwork live in each niche’s shop. <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>Browse the shops</Text>
                </Text>
              </Pressable>
            </View>
          ) : (
            sellers.map((sid) => {
              const seller = usersById[sid];
              return (
                <View key={sid} style={{ gap: 8 }}>
                  <View style={styles.sellerRow}>
                    <Avatar user={seller} size={22} />
                    <Text style={[styles.sellerName, { color: ground.text }]}>{seller?.username}</Text>
                  </View>
                  {lines
                    .filter((x) => x.listing.sellerId === sid)
                    .map(({ item, listing }) => {
                      const max = listing.format === 'digital' ? 1 : listing.stock ?? 10;
                      return (
                        <View key={listing.id} style={styles.card}>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${listing.title}`} onPress={() => router.push({ pathname: '/shop/[id]', params: { id: listing.id } })} style={[styles.thumb, { backgroundColor: listing.mediaColor }]}>
                            {listingPhoto(listing) ? <Image source={listingPhoto(listing)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                          </Pressable>
                          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                            <Text style={[styles.title, { color: ground.text }]} numberOfLines={2}>{listing.title}</Text>
                            <Text style={[styles.sub, { color: ground.muted }]}>
                              {listing.format === 'digital' ? 'Digital download' : listing.shippingCents ? `${formatPrice(listing.shippingCents)} shipping` : 'Free shipping'}
                            </Text>
                            <View style={styles.controls}>
                              {listing.format === 'physical' ? (
                                <View style={[styles.stepper, { borderColor: ground.line }]}>
                                  <Pressable accessibilityRole="button" accessibilityLabel={item.qty === 1 ? `Remove ${listing.title}` : 'Fewer'} onPress={() => setQty(listing.id, item.qty - 1)} style={styles.step}>
                                    <Text style={[styles.stepText, { color: ground.text }]}>−</Text>
                                  </Pressable>
                                  <Text style={[styles.qty, { color: ground.text }]}>{item.qty}</Text>
                                  <Pressable accessibilityRole="button" accessibilityLabel="More" disabled={item.qty >= max} onPress={() => setQty(listing.id, item.qty + 1)} style={styles.step}>
                                    <Text style={[styles.stepText, { color: ground.text, opacity: item.qty >= max ? 0.3 : 1 }]}>+</Text>
                                  </Pressable>
                                </View>
                              ) : null}
                              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${listing.title}`} onPress={() => setQty(listing.id, 0)} hitSlop={6}>
                                <Text style={[styles.remove, { color: ground.muted }]}>Remove</Text>
                              </Pressable>
                            </View>
                          </View>
                          <Text style={[styles.price, { color: ground.text }]}>{formatPrice(listing.priceCents * item.qty)}</Text>
                        </View>
                      );
                    })}
                </View>
              );
            })
          )}

          {lines.length ? (
            <View style={[styles.card, styles.sums]}>
              {row(count === 1 ? 'Item' : 'Items', formatPrice(subtotal))}
              {row('Shipping', shipping ? formatPrice(shipping) : lines.some((x) => x.listing.format === 'physical') ? 'Free' : 'None')}
              {row('Total', formatPrice(subtotal + shipping), true)}
              <Text style={[styles.fee, { color: ground.muted }]}>No fees for you. Sellers pay Niches {Math.round(FEE_RATE * 100)}%.</Text>
            </View>
          ) : null}
        </ScrollView>

        {lines.length ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: ground.ground, borderTopColor: ground.line }]}>
            <Pressable accessibilityRole="button" onPress={() => setPaying(true)} style={({ pressed }) => [styles.checkout, { backgroundColor: ground.text, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.checkoutText, { color: ground.ground }]}>Checkout · {formatPrice(subtotal + shipping)}</Text>
            </Pressable>
          </View>
        ) : null}

        <CheckoutSheet
          visible={paying}
          items={state.cart}
          onClose={() => setPaying(false)}
          onPlaced={(orders) => {
            setPaying(false);
            if (orders.length === 1) router.replace({ pathname: '/shop/order/[id]', params: { id: orders[0].id, fresh: '1' } });
            else router.replace('/shop/orders');
          }}
        />
      </View>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  back: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1 },
  count: { fontSize: 14 },
  linkHit: { minHeight: 36, justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 30 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sellerName: { fontSize: 14, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 20, backgroundColor: '#FFFFFF' },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden' },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23 },
  sub: { fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, height: 32 },
  step: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 17, fontWeight: '600' },
  qty: { minWidth: 14, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  remove: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  price: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sums: { flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 15 },
  sumValue: { fontSize: 15, fontVariant: ['tabular-nums'] },
  fee: { fontSize: 12, marginTop: 2 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  checkout: { minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  checkoutText: { fontSize: 16, fontWeight: '700' },
});
