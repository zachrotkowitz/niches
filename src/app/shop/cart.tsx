import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, LockIcon } from '@/components/icons';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { FEE_RATE, formatPrice, type Listing, type Order } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

type Step = 'cart' | 'checkout' | 'done';

/** Cart, then a pretend checkout (nothing is charged), then a confirmation. */
export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [step, setStep] = useState<Step>('cart');
  const [name, setName] = useState(state.me?.displayName ?? '');
  const [address, setAddress] = useState('');
  const [placed, setPlaced] = useState<Order[]>([]);
  const accent = niches[state.niche].accent;

  const lines = state.cart
    .map((c) => ({ item: c, listing: state.listings.find((l) => l.id === c.listingId) }))
    .filter((x): x is { item: typeof x.item; listing: Listing } => !!x.listing);
  const sellers = [...new Set(lines.map((x) => x.listing.sellerId))];
  const subtotal = lines.reduce((n, x) => n + x.listing.priceCents * x.item.qty, 0);
  const shipping = lines.reduce((n, x) => n + (x.listing.format === 'physical' ? x.listing.shippingCents ?? 0 : 0), 0);
  const needsAddress = lines.some((x) => x.listing.format === 'physical');
  const canPay = !needsAddress || (name.trim().length > 1 && address.trim().length > 5);

  const setQty = (listingId: string, qty: number) =>
    actions.setCart(qty <= 0 ? state.cart.filter((c) => c.listingId !== listingId) : state.cart.map((c) => (c.listingId === listingId ? { ...c, qty } : c)));

  const goBack = () => {
    if (step === 'checkout') return setStep('cart');
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const pay = () => {
    if (!state.me || !canPay) return;
    const orders = actions.checkout(state.me.id, state.cart, state.listings, needsAddress ? `${name.trim()}, ${address.trim()}` : undefined);
    setPlaced(orders);
    setStep('done');
  };

  if (step === 'done') {
    const total = placed.reduce((n, o) => n + o.subtotalCents + o.shippingCents, 0);
    const hasDigital = placed.some((o) => o.lines.some((l) => l.format === 'digital'));
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 40, paddingHorizontal: 24, gap: 16 }]}>
        <View style={[styles.doneCheck, { backgroundColor: accent }]}>
          <CheckIcon size={30} />
        </View>
        <DisplayText size={32}>Order placed</DisplayText>
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>Demo: no money was charged.</Text>
        </View>
        <Text style={styles.doneBody}>
          {formatPrice(total)} across {placed.length} {placed.length === 1 ? 'shop' : 'shops'}. {hasDigital ? 'Digital items are ready to download in Your orders. ' : ''}
          {needsAddress ? 'Sellers usually ship in 3–5 days.' : ''}
        </Text>
        <Button label="See your orders" color={accent} onPress={() => router.replace('/shop/orders')} />
        <Button label="Keep browsing" tone="outline" onPress={() => router.navigate('/')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={step === 'checkout' ? 'Back to cart' : 'Back'} onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>{step === 'cart' ? 'Your cart' : 'Checkout'}</Text>
        <View style={{ width: TOUCH }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled">
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyBody}>Find cookbooks, prints and artwork in the Shop of each niche.</Text>
            <Button label="Browse the shops" color={accent} onPress={() => { actions.setHomeMode('shop'); router.navigate('/'); }} />
          </View>
        ) : step === 'cart' ? (
          sellers.map((sid) => {
            const seller = usersById[sid];
            return (
              <View key={sid} style={styles.sellerGroup}>
                <View style={styles.sellerRow}>
                  <Avatar user={seller} size={26} />
                  <Text style={styles.sellerName}>{seller?.username}</Text>
                </View>
                {lines
                  .filter((x) => x.listing.sellerId === sid)
                  .map(({ item, listing }) => {
                    const max = listing.format === 'digital' ? 1 : listing.stock ?? 10;
                    return (
                      <View key={listing.id} style={styles.line}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${listing.title}`} onPress={() => router.push({ pathname: '/shop/[id]', params: { id: listing.id } })} style={[styles.thumb, { backgroundColor: listing.mediaColor, overflow: 'hidden' }]}>
                          {listing.imageUri ? <Image source={{ uri: listing.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                        </Pressable>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.lineTitle} numberOfLines={2}>{listing.title}</Text>
                          <Text style={styles.lineSub}>{listing.format === 'digital' ? 'Digital download' : listing.shippingCents ? `${formatPrice(listing.shippingCents)} shipping` : 'Free shipping'}</Text>
                          <View style={styles.lineControls}>
                            {listing.format === 'physical' ? (
                              <View style={styles.stepper}>
                                <Pressable accessibilityRole="button" accessibilityLabel={item.qty === 1 ? `Remove ${listing.title}` : 'Fewer'} onPress={() => setQty(listing.id, item.qty - 1)} style={styles.step}>
                                  <Text style={styles.stepText}>−</Text>
                                </Pressable>
                                <Text style={styles.qty}>{item.qty}</Text>
                                <Pressable accessibilityRole="button" accessibilityLabel="More" disabled={item.qty >= max} onPress={() => setQty(listing.id, item.qty + 1)} style={styles.step}>
                                  <Text style={[styles.stepText, { opacity: item.qty >= max ? 0.3 : 1 }]}>+</Text>
                                </Pressable>
                              </View>
                            ) : null}
                            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${listing.title}`} onPress={() => setQty(listing.id, 0)} style={styles.remove}>
                              <Text style={styles.removeText}>Remove</Text>
                            </Pressable>
                          </View>
                        </View>
                        <Text style={styles.linePrice}>{formatPrice(listing.priceCents * item.qty)}</Text>
                      </View>
                    );
                  })}
              </View>
            );
          })
        ) : (
          <>
            {needsAddress ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.section}>Ship to</Text>
                <TextInput accessibilityLabel="Full name" value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#6B7178" style={styles.input} selectionColor={accent} autoComplete="name" />
                <TextInput accessibilityLabel="Address" value={address} onChangeText={setAddress} placeholder="Street, city, state, ZIP" placeholderTextColor="#6B7178" style={styles.input} selectionColor={accent} autoComplete="street-address" />
              </View>
            ) : null}
            <View style={{ gap: 10 }}>
              <Text style={styles.section}>Pay with</Text>
              <View style={styles.card}>
                <LockIcon size={16} color={colors.textSecondary} />
                <Text style={styles.cardText}>Demo card •••• 4242</Text>
              </View>
              <Text style={styles.hint}>This is a demo. Nothing will be charged. Real payments will go through Stripe.</Text>
            </View>
          </>
        )}

        {lines.length ? (
          <View style={styles.summary}>
            <Row label="Items" value={formatPrice(subtotal)} />
            <Row label="Shipping" value={shipping ? formatPrice(shipping) : 'Free'} />
            <Row label="Total" value={formatPrice(subtotal + shipping)} bold />
            <Text style={styles.feeNote}>No extra fees for you. Each seller pays Niches {Math.round(FEE_RATE * 100)}% of their sale.</Text>
          </View>
        ) : null}
      </ScrollView>

      {lines.length ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {step === 'cart' ? (
            <Button label={`Checkout · ${formatPrice(subtotal + shipping)}`} color={accent} onPress={() => setStep('checkout')} />
          ) : (
            <Button label={`Place order · ${formatPrice(subtotal + shipping)}`} color={accent} disabled={!canPay} onPress={pay} />
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold ? styles.bold : null]}>{label}</Text>
      <Text style={[styles.rowValue, bold ? styles.bold : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  empty: { padding: 20, borderRadius: 18, backgroundColor: colors.surface, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  sellerGroup: { gap: 12 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  line: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  lineTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  lineSub: { fontSize: 13, color: colors.textMuted },
  lineControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  linePrice: { fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  step: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, fontWeight: '600', color: colors.text },
  qty: { minWidth: 16, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.text },
  remove: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 },
  removeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  section: { fontSize: 17, fontWeight: '700', color: colors.text },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH + 4, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  cardText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  hint: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  summary: { padding: 16, borderRadius: 16, backgroundColor: colors.surface, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, color: colors.textSecondary },
  rowValue: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '800', color: colors.text, fontSize: 17 },
  feeNote: { fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.ground, borderTopWidth: 1, borderTopColor: colors.hairline },
  doneCheck: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  demoBanner: { alignSelf: 'flex-start', backgroundColor: colors.note, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  demoText: { fontSize: 14, fontWeight: '700', color: '#5C4A00' },
  doneBody: { fontSize: 16, lineHeight: 23, color: colors.textSecondary },
});
