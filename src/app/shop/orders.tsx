import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { ChevronLeftIcon, DownloadIcon } from '@/components/icons';
import { Avatar, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { UnderlineTabs } from '@/components/underline-tabs';
import { listingPhoto } from '@/lib/demo-photos';
import { formatPrice, type Order } from '@/lib/shop';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

type Tab = 'purchases' | 'sales';

/**
 * Orders, in the new shop style (founder, Nov 21 2026): a masthead, quiet
 * tabs Purchases · Sales, and one white card per order with its photo, a
 * status line with a colored dot, and the one thing to do next (Download,
 * Mark shipped, It arrived). Tap a purchase to see its tracker.
 */
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const meId = state.me?.id;
  const purchases = state.orders.filter((o) => o.buyerId === meId);
  const sales = state.orders.filter((o) => o.sellerId === meId);
  const [tab, setTab] = useState<Tab>(purchases.length || !sales.length ? 'purchases' : 'sales');
  const shown = tab === 'purchases' ? purchases : sales;
  const sellsAnything = sales.length > 0 || state.listings.some((l) => l.sellerId === meId);

  const status = (o: Order): { text: string; dot: string } => {
    if (o.status === 'ready') return { text: 'Ready to download', dot: '#3D7A55' };
    if (o.status === 'delivered') return { text: 'Delivered', dot: '#3D7A55' };
    if (o.status === 'shipped') return { text: 'On its way', dot: '#C9A23A' };
    return tab === 'sales' ? { text: 'Paid · ship it', dot: '#C8553D' } : { text: 'Ordered · not shipped yet', dot: '#C9A23A' };
  };

  return (
    <SurfaceProvider value={ground}>
      <ScrollView style={{ flex: 1, backgroundColor: ground.ground }} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={42} color={ground.text}>Orders</DisplayText>
        </View>
        {sellsAnything ? (
          <UnderlineTabs
            label="Purchases or sales"
            inset={0}
            value={tab}
            onChange={(k) => setTab(k as Tab)}
            items={[
              { key: 'purchases', label: `Purchases · ${purchases.length}` },
              { key: 'sales', label: `Sales · ${sales.length}` },
            ]}
          />
        ) : null}

        {tab === 'sales' && sales.length ? (
          <Pressable accessibilityRole="link" onPress={() => router.push('/shop/dashboard')} style={styles.linkHit}>
            <Text style={[styles.link, { color: ground.text }]}>See earnings in Your shop</Text>
          </Pressable>
        ) : null}

        {!shown.length ? (
          <View style={{ gap: 4, paddingTop: 8 }}>
            <Text style={[styles.emptyTitle, { color: ground.text }]}>{tab === 'purchases' ? 'Nothing bought yet.' : 'No sales yet.'}</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => (tab === 'purchases' ? (actions.setHomeMode('shop'), router.navigate('/')) : router.push('/shop/new'))}
              style={styles.linkHit}>
              <Text style={[styles.emptyBody, { color: ground.muted }]}>
                {tab === 'purchases' ? 'Cookbooks, prints and artwork you buy show up here. ' : 'When someone buys from you, it shows up here. '}
                <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>{tab === 'purchases' ? 'Browse the shops' : 'List something'}</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          shown.map((o) => {
            const other = usersById[tab === 'purchases' ? o.sellerId : o.buyerId];
            const first = state.listings.find((l) => l.id === o.lines[0]?.listingId);
            const niche = niches[first?.niche ?? state.niche];
            const digital = o.lines.every((l) => l.format === 'digital');
            const st = status(o);
            const title = o.lines.length === 1 ? o.lines[0].title : `${o.lines[0].title} + ${o.lines.length - 1} more`;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${st.text}`}
                onPress={() => (tab === 'purchases' ? router.push({ pathname: '/shop/order/[id]', params: { id: o.id } }) : first && router.push({ pathname: '/shop/[id]', params: { id: first.id } }))}
                style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.thumb, { backgroundColor: first?.mediaColor ?? niche.field }]}>
                    {first && listingPhoto(first) ? <Image source={listingPhoto(first)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={[styles.title, { color: ground.text }]} numberOfLines={2}>{title}</Text>
                    <View style={styles.whoRow}>
                      <Avatar user={other} size={18} />
                      <Text style={[styles.who, { color: ground.muted }]} numberOfLines={1}>
                        {tab === 'purchases' ? other?.username : `Sold to ${other?.username}`} · {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.price, { color: ground.text }]}>
                    {formatPrice(tab === 'purchases' ? o.subtotalCents + o.shippingCents : o.subtotalCents - o.feeCents)}
                  </Text>
                </View>
                {tab === 'sales' && o.shipTo && o.status === 'paid' ? <Text style={[styles.shipTo, { color: ground.muted }]}>Ship to {o.shipTo}</Text> : null}
                <View style={[styles.foot, { borderTopColor: ground.line }]}>
                  <View style={[styles.dot, { backgroundColor: st.dot }]} />
                  <Text style={[styles.status, { color: ground.text }]}>{st.text}</Text>
                  <View style={{ flex: 1 }} />
                  {tab === 'purchases' && digital ? (
                    <Pressable accessibilityRole="button" onPress={() => toast('Demo: your download would start here')} style={[styles.pill, { backgroundColor: ground.text }]}>
                      <DownloadIcon size={13} color={ground.ground} />
                      <Text style={[styles.pillText, { color: ground.ground }]}>Download</Text>
                    </Pressable>
                  ) : null}
                  {tab === 'sales' && o.status === 'paid' ? (
                    <Pressable accessibilityRole="button" onPress={() => (actions.setOrderStatus(o.id, 'shipped'), toast('Marked as shipped. The buyer gets a notice.'))} style={[styles.pill, { backgroundColor: ground.text }]}>
                      <Text style={[styles.pillText, { color: ground.ground }]}>Mark shipped</Text>
                    </Pressable>
                  ) : null}
                  {tab === 'purchases' && o.status === 'shipped' ? (
                    <Pressable accessibilityRole="button" onPress={() => actions.setOrderStatus(o.id, 'delivered')} style={[styles.pill, styles.pillOutline, { borderColor: ground.text }]}>
                      <Text style={[styles.pillText, { color: ground.text }]}>It arrived</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
        {shown.length ? <Eyebrow style={{ marginTop: 8, textAlign: 'center' }}>Demo: no money changed hands</Eyebrow> : null}
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  back: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  masthead: { paddingBottom: 8, borderBottomWidth: 1 },
  linkHit: { minHeight: 36, justifyContent: 'center' },
  link: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 30 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  card: { padding: 12, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden' },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 23 },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  who: { fontSize: 12, flexShrink: 1 },
  price: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  shipTo: { fontSize: 12, lineHeight: 17 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: 13, fontWeight: '600' },
  pill: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillOutline: { borderWidth: 1.5, backgroundColor: 'transparent' },
  pillText: { fontSize: 13, fontWeight: '700' },
});
