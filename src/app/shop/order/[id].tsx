import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { CheckIcon, ChevronLeftIcon, DownloadIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { listingPhoto } from '@/lib/demo-photos';
import { formatPrice, type OrderStatus } from '@/lib/shop';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

const STEPS: { key: OrderStatus | 'out'; label: string }[] = [
  { key: 'paid', label: 'Ordered' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

/**
 * After you buy (founder, Nov 20 2026; like the Shop app): "It's yours.",
 * what you bought, then a tracker for things that ship or a big Download
 * button for digital items.
 */
export default function OrderPlaced() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const order = state.orders.find((o) => o.id === id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/shop/orders'));

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: ground.ground, paddingTop: insets.top + 60, paddingHorizontal: 20 }}>
        <DisplayText size={28} color={ground.text}>This order isn’t here anymore.</DisplayText>
      </View>
    );
  }
  const seller = usersById[order.sellerId];
  const first = state.listings.find((l) => l.id === order.lines[0]?.listingId);
  const accent = niches[first?.niche ?? state.niche].accent;
  const digital = order.lines.every((l) => l.format === 'digital');
  const reached = order.status === 'delivered' ? 3 : order.status === 'shipped' ? 1 : 0;
  const names = order.lines.map((l) => l.title);

  return (
    <SurfaceProvider value={ground}>
      <ScrollView style={{ flex: 1, backgroundColor: ground.ground }} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={styles.back}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        <View style={[styles.check, { backgroundColor: accent }]}>
          <CheckIcon size={26} strokeWidth={2.8} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: ground.text }]}>{fresh ? 'It’s yours.' : 'Your order'}</Text>
        <Text style={[styles.sub, { color: ground.muted }]}>
          {digital ? `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} ready to download.` : `${names.join(', ')} ${order.status === 'delivered' ? 'arrived' : `is on its way from ${seller?.username}`}.`}
        </Text>
        {order.lines.map((l) => {
          const listing = state.listings.find((x) => x.id === l.listingId);
          return (
            <Pressable key={l.listingId} accessibilityRole="button" onPress={() => listing && router.push({ pathname: '/shop/[id]', params: { id: listing.id } })} style={styles.item}>
              <View style={[styles.thumb, { backgroundColor: listing?.mediaColor ?? ground.line }]}>
                {listing && listingPhoto(listing) ? <Image source={listingPhoto(listing)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: ground.text }]} numberOfLines={2}>{l.title}</Text>
                <Text style={[styles.itemSub, { color: ground.muted }]}>{l.format === 'digital' ? 'Digital download' : `${l.qty > 1 ? `${l.qty} × ` : ''}${formatPrice(l.priceCents)}`}</Text>
              </View>
            </Pressable>
          );
        })}
        <Text style={[styles.total, { color: ground.muted }]}>Paid {formatPrice(order.subtotalCents + order.shippingCents)}{order.shippingCents ? ` with ${formatPrice(order.shippingCents)} shipping` : ''} · Demo: nothing was charged</Text>

        {digital ? (
          <Pressable accessibilityRole="button" onPress={() => toast('Demo: the file would download here')} style={[styles.download, { backgroundColor: ground.text }]}>
            <DownloadIcon size={18} color={ground.ground} />
            <Text style={[styles.downloadText, { color: ground.ground }]}>Download</Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: 4 }}>
            <Eyebrow>Where it is</Eyebrow>
            <View style={{ marginTop: 10 }}>
              {STEPS.map((s, i) => {
                const on = i <= reached;
                const last = i === STEPS.length - 1;
                return (
                  <View key={s.key} style={styles.step}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[styles.dot, on ? { backgroundColor: accent, borderColor: accent } : { borderColor: ground.line }]} />
                      {last ? null : <View style={[styles.lineV, { backgroundColor: i < reached ? accent : ground.line }]} />}
                    </View>
                    <View style={{ paddingBottom: 14 }}>
                      <Text style={[styles.stepLabel, { color: on ? ground.text : ground.muted }]}>{s.label}</Text>
                      {i === 0 ? <Text style={[styles.stepSub, { color: ground.muted }]}>{new Date(order.createdAt).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text> : null}
                      {i === 1 && !on ? <Text style={[styles.stepSub, { color: ground.muted }]}>Small shops usually ship in 2–5 days</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View style={styles.links}>
          <Pressable accessibilityRole="link" onPress={() => router.replace('/shop/orders')} style={styles.linkHit}>
            <Text style={[styles.link, { color: ground.text }]}>Your orders</Text>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/')} style={styles.linkHit}>
            <Text style={[styles.link, { color: ground.text }]}>Keep browsing</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  back: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  check: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  sub: { fontSize: 15, lineHeight: 21 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF' },
  thumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  itemTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23 },
  itemSub: { fontSize: 12, marginTop: 2 },
  total: { fontSize: 12 },
  download: { minHeight: 54, borderRadius: 27, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  downloadText: { fontSize: 16, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  lineV: { width: 2, flex: 1, minHeight: 26 },
  stepLabel: { fontSize: 15, fontWeight: '700' },
  stepSub: { fontSize: 12 },
  links: { flexDirection: 'row', gap: 22 },
  linkHit: { minHeight: TOUCH, justifyContent: 'center' },
  link: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
