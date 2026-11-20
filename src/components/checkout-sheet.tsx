import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { listingPhoto } from '@/lib/demo-photos';
import { formatPrice, type CartItem, type Listing, type Order } from '@/lib/shop';
import { useAppGround, useStore } from '@/lib/store';
import { fonts, groundSurface } from '@/lib/theme';

const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

/**
 * Checkout on one sheet (founder, Nov 20 2026; like Shopify's Shop Pay): what
 * you're buying, the total, an address only when something ships, and one
 * Pay button. Used by "Buy now" on a listing and by the cart. Demo: nothing
 * is charged.
 */
export function CheckoutSheet({ visible, items, onClose, onPlaced }: { visible: boolean; items: CartItem[]; onClose: () => void; onPlaced: (orders: Order[]) => void }) {
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const ground = groundSurface(useAppGround());
  const [name, setName] = useState(state.me?.displayName ?? '');
  const [address, setAddress] = useState('');

  const lines = items
    .map((c) => ({ item: c, listing: state.listings.find((l) => l.id === c.listingId) }))
    .filter((x): x is { item: CartItem; listing: Listing } => !!x.listing);
  const subtotal = lines.reduce((n, x) => n + x.listing.priceCents * x.item.qty, 0);
  const shipping = lines.reduce((n, x) => n + (x.listing.format === 'physical' ? x.listing.shippingCents ?? 0 : 0), 0);
  const ships = lines.some((x) => x.listing.format === 'physical');
  const ready = !!state.me && lines.length > 0 && (!ships || (name.trim().length > 1 && address.trim().length > 5));

  const pay = () => {
    if (!ready || !state.me) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const orders = actions.checkout(state.me.id, items, state.listings, ships ? `${name.trim()}, ${address.trim()}` : undefined);
    onPlaced(orders);
  };
  const row = (label: string, value: string, bold = false) => (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, { color: bold ? ground.text : ground.muted, fontWeight: bold ? '800' : '400' }]}>{label}</Text>
      <Text style={[styles.sumValue, { color: ground.text, fontWeight: bold ? '800' : '600' }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Nothing behind is dimmed (founder); tap above the sheet to close. */}
        <Pressable accessibilityRole="button" accessibilityLabel="Close checkout" style={{ flex: 1, minHeight: insets.top + 24 }} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>Checkout</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={6} style={styles.close}>
              <CloseIcon size={20} color={ground.text} />
            </Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
            {lines.map(({ item, listing }) => (
              <View key={listing.id} style={styles.item}>
                <View style={[styles.thumb, { backgroundColor: listing.mediaColor }]}>
                  {listingPhoto(listing) ? <Image source={listingPhoto(listing)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.itemTitle, { color: ground.text }]} numberOfLines={2}>{listing.title}</Text>
                  <Text style={[styles.itemSub, { color: ground.muted }]} numberOfLines={1}>
                    {usersById[listing.sellerId]?.username} · {listing.format === 'digital' ? 'Digital download' : item.qty > 1 ? `${item.qty} copies` : 'Ships to you'}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: ground.text }]}>{formatPrice(listing.priceCents * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.sums}>
              {row(lines.length === 1 ? 'Item' : 'Items', formatPrice(subtotal))}
              {row('Shipping', ships ? (shipping ? formatPrice(shipping) : 'Free') : 'None, it’s a download')}
              {row('Total', formatPrice(subtotal + shipping), true)}
            </View>
            {ships ? (
              <View style={{ gap: 8 }}>
                <Text style={[styles.label, { color: ground.muted }]}>SHIP TO</Text>
                <View style={styles.box}>
                  <TextInput accessibilityLabel="Full name" value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={ground.muted} selectionColor={ground.text} style={[styles.input, { color: ground.text }, webInput]} />
                </View>
                <View style={styles.box}>
                  <TextInput accessibilityLabel="Address" value={address} onChangeText={setAddress} placeholder="Street, city, state, ZIP" placeholderTextColor={ground.muted} selectionColor={ground.text} style={[styles.input, { color: ground.text }, webInput]} />
                </View>
              </View>
            ) : null}
            <View style={[styles.payWith, { borderColor: ground.line }]}>
              <Text style={[styles.payWithLabel, { color: ground.text }]}>Pay with</Text>
              <Text style={[styles.payWithValue, { color: ground.text }]}>{Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay'}</Text>
            </View>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={pay}
            style={({ pressed }) => [styles.pay, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
            <Text style={[styles.payText, { color: ground.ground }]}>Pay {formatPrice(subtotal + shipping)}</Text>
          </Pressable>
          <Text style={[styles.note, { color: ground.muted }]}>Demo: no money is charged. No fees for you; sellers pay Niches 5%.</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '88%', flexShrink: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 12, shadowColor: '#1F1A14', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,26,20,0.18)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,26,20,0.07)', alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF' },
  thumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  itemTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23 },
  itemSub: { fontSize: 12, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sums: { gap: 8, paddingHorizontal: 2, paddingTop: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 15 },
  sumValue: { fontSize: 15, fontVariant: ['tabular-nums'] },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  box: { paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#FFFFFF' },
  input: { fontSize: 15, paddingVertical: 12 },
  payWith: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth * 2, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  payWithLabel: { fontSize: 15, fontWeight: '600' },
  payWithValue: { fontSize: 14, fontWeight: '700' },
  pay: { minHeight: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  payText: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, textAlign: 'center' },
});
