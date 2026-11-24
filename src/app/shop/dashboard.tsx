import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { UnderlineTabs } from '@/components/underline-tabs';
import { listingPhoto } from '@/lib/demo-photos';
import { FEE_RATE, formatPrice } from '@/lib/shop';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

type Period = '7' | '30' | 'all';
const DAY = 24 * 3600 * 1000;

/**
 * Your shop: the seller dashboard (founder, Nov 20 2026; ideas from Shopify's
 * admin and eBay's Seller Hub). What you earned after Niches' 5%, a small
 * chart, orders, views and how many viewers buy, a To do list, best sellers
 * and your listings. Only the seller ever sees these numbers.
 */
export default function SellerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [period, setPeriod] = useState<Period>('7');
  const meId = state.me?.id;
  const mine = state.listings.filter((l) => l.sellerId === meId);
  const since = period === 'all' ? 0 : Date.now() - Number(period) * DAY;
  const sales = state.orders.filter((o) => o.sellerId === meId && o.createdAt >= since);
  const allSales = state.orders.filter((o) => o.sellerId === meId);
  const net = (o: (typeof sales)[number]) => o.subtotalCents - o.feeCents;
  const earned = sales.reduce((n, o) => n + net(o), 0);
  const views = mine.reduce((n, l) => n + (l.views ?? 0), 0);
  const sold = sales.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.qty, 0), 0);
  const buyRate = views ? Math.round((sold / views) * 100) : 0;
  const toShip = allSales.filter((o) => o.status === 'paid' && o.lines.some((l) => l.format === 'physical'));
  const low = mine.filter((l) => l.format === 'physical' && l.stock !== undefined && l.stock <= 3);
  // Only things that have actually sold (founder, Nov 24 2026).
  const best = mine.filter((l) => l.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 3);

  // Earnings in 7 bars: days for "7 days", groups of days otherwise.
  const span = period === 'all' ? Math.max(7, Math.ceil((Date.now() - Math.min(Date.now(), ...allSales.map((o) => o.createdAt))) / DAY) + 1) : Number(period);
  const per = Math.ceil(span / 7);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const end = Date.now() - (6 - i) * per * DAY;
    return allSales.filter((o) => o.createdAt > end - per * DAY && o.createdAt <= end).reduce((n, o) => n + net(o), 0);
  });
  // A label under each bar (founder, Nov 24 2026): days for 7 days, the start date of each stretch otherwise.
  const barLabels = Array.from({ length: 7 }, (_, i) => {
    const end = new Date(Date.now() - (6 - i) * per * DAY);
    if (i === 6 && per === 1) return 'Today';
    if (per === 1) return end.toLocaleDateString(undefined, { weekday: 'short' });
    return new Date(end.getTime() - (per - 1) * DAY).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  const drafts = state.listingDrafts.filter((d) => d.sellerId === meId);
  const newest = [...mine].sort((a, b) => b.createdAt - a.createdAt);
  const top = Math.max(1, ...bars);
  const accent = niches[mine[0]?.niche ?? state.niche].accent;

  const stat = (n: string, label: string) => (
    <View style={styles.stat}>
      <Text style={[styles.statNum, { color: ground.text }]}>{n}</Text>
      <Text style={[styles.statLabel, { color: ground.muted }]}>{label}</Text>
    </View>
  );
  const todo = (title: string, sub: string, onPress: () => void) => (
    <Pressable key={title} accessibilityRole="button" onPress={onPress} style={[styles.todo, { borderBottomColor: ground.line }]}>
      <View style={styles.todoDot} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.todoTitle, { color: ground.text }]}>{title}</Text>
        <Text style={[styles.todoSub, { color: ground.muted }]}>{sub}</Text>
      </View>
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <ChevronLeftIcon size={16} color={ground.muted} />
      </View>
    </Pressable>
  );

  return (
    <SurfaceProvider value={ground}>
      <ScrollView style={{ flex: 1, backgroundColor: ground.ground }} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={40} color={ground.text}>Your shop</DisplayText>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/new', params: { niche: state.niche } })} style={[styles.newPill, { backgroundColor: ground.text }]}>
            <PlusIcon size={14} color={ground.ground} strokeWidth={2.4} />
            <Text style={[styles.newText, { color: ground.ground }]}>New listing</Text>
          </Pressable>
        </View>

        {/* Drafts, titles only, right under the heading (founder picked option A, Nov 24 2026). */}
        {drafts.length ? (
          <View style={styles.draftCard}>
            <Text style={[styles.draftTitle, { fontSize: 15, fontWeight: '700', color: ground.text }]}>{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {drafts.map((d) => (
                <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`Finish draft: ${d.title || 'Untitled'}`} onPress={() => router.push({ pathname: '/shop/new', params: { draft: d.id } })} style={styles.draftTile}>
                  <View style={[styles.draftPhoto, { backgroundColor: '#E8E2D6' }]}>
                    {d.photos[0] ? <Image source={{ uri: d.photos[0] }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                  </View>
                  <Text style={[styles.draftTitle, { color: d.title ? ground.text : ground.muted }]} numberOfLines={2}>{d.title || 'Untitled'}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {!mine.length ? (
          <View style={{ gap: 6, paddingTop: 10 }}>
            <Text style={[styles.emptyTitle, { color: ground.text }]}>Nothing for sale yet.</Text>
            <Text style={[styles.emptyBody, { color: ground.muted }]}>List a recipe collection, a print or a cookbook. You keep {100 - Math.round(FEE_RATE * 100)}% of every sale.</Text>
          </View>
        ) : (
          <>
            <UnderlineTabs
              value={period}
              label="Time period"
              inset={0}
              onChange={(k) => setPeriod(k as Period)}
              items={[
                { key: '7', label: '7 days' },
                { key: '30', label: '30 days' },
                { key: 'all', label: 'All time' },
              ]}
            />
            <View style={styles.card}>
              {/* "Sales: $X", one size (founder, Nov 24 2026); still what you keep after Niches' 5%. */}
              <Text accessibilityRole="header" style={[styles.earned, { color: ground.text }]}>Sales: {formatPrice(earned)}</Text>
              <View style={styles.chart} accessibilityLabel="Sales over time">
                {bars.map((v, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height: 6 + (v / top) * 58, backgroundColor: i === 6 ? accent : `${accent}55` }]} />
                    <Text style={[styles.barLabel, { color: ground.muted }]} numberOfLines={1}>{barLabels[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.stats}>
              {stat(String(sales.length), sales.length === 1 ? 'order' : 'orders')}
              {stat(views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views), views === 1 ? 'view' : 'views')}
              {/* "6% of viewers bought" (founder, Nov 24 2026). */}
              {/* Only once someone has looked (or bought): before that, just two cards sharing the row (founder, Nov 24 2026). */}
              {views ? stat(`${Math.min(100, buyRate)}%`, 'of viewers bought') : sold ? stat(String(sold), sold === 1 ? 'buyer' : 'buyers') : null}
            </View>

            {toShip.length || low.length ? (
              <View>
                <Eyebrow>To do</Eyebrow>
                {toShip.length ? todo(`${toShip.length} ${toShip.length === 1 ? 'order' : 'orders'} to ship`, 'Mark them shipped in Orders', () => router.push('/shop/orders')) : null}
                {low.map((l) => todo(`${l.title} is low`, l.stock === 0 ? 'Sold out' : `${l.stock} left in stock`, () => router.push({ pathname: '/shop/[id]', params: { id: l.id } })))}
              </View>
            ) : null}

            {best.length ? (
            <View>
              <Eyebrow>Best sellers</Eyebrow>
              {best.map((l) => (
                <Pressable key={l.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/[id]', params: { id: l.id } })} style={[styles.best, { borderBottomColor: ground.line }]}>
                  <View style={[styles.thumb, { backgroundColor: l.mediaColor }]}>
                    {listingPhoto(l) ? <Image source={listingPhoto(l)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                  </View>
                  <Text style={[styles.bestTitle, { color: ground.text }]} numberOfLines={2}>{l.title}</Text>
                  <Text style={[styles.bestNums, { color: ground.muted }]}>
                    {l.views ?? 0} views{'\n'}
                    <Text style={{ color: ground.text, fontWeight: '700' }}>{l.sold} sold</Text>
                  </Text>
                </Pressable>
              ))}
            </View>
            ) : null}

            {/* Every listing, newest first, with price and views (founder, Nov 24 2026). */}
            <View>
              <Eyebrow>Your listings · {mine.length}</Eyebrow>
              {newest.map((l) => (
                <Pressable key={l.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/[id]', params: { id: l.id } })} style={[styles.best, { borderBottomColor: ground.line }]}>
                  <View style={[styles.thumb, { backgroundColor: l.mediaColor }]}>
                    {listingPhoto(l) ? <Image source={listingPhoto(l)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                  </View>
                  <Text style={[styles.bestTitle, { color: ground.text }]} numberOfLines={2}>{l.title}</Text>
                  <Text style={[styles.bestNums, { color: ground.muted }]}>
                    <Text style={{ color: ground.text, fontWeight: '700' }}>{formatPrice(l.priceCents)}</Text>{'\n'}
                    {l.views ?? 0} {(l.views ?? 0) === 1 ? 'view' : 'views'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* No payout card: sellers get paid automatically, nothing to wait on (founder, Nov 24 2026). */}
            <Text style={[styles.note, { color: ground.muted }]}>Only you can see these numbers.</Text>
          </>
        )}
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  back: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1 },
  newPill: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newText: { fontSize: 14, fontWeight: '700' },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 30 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  card: { padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 4 },
  earned: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barLabel: { fontSize: 10 },
  draftCard: { padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  draftTile: { width: 110, gap: 5 },
  draftPhoto: { height: 80, borderRadius: 12, overflow: 'hidden' },
  draftTitle: { fontSize: 13, fontWeight: '600' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 86, marginTop: 10 },
  bar: { alignSelf: 'stretch', borderRadius: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF', gap: 2 },
  statNum: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  statLabel: { fontSize: 12 },
  todo: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  todoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8553D' },
  todoTitle: { fontSize: 14, fontWeight: '700' },
  todoSub: { fontSize: 12 },
  best: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2, paddingVertical: 6 },
  thumb: { width: 42, height: 42, borderRadius: 10, overflow: 'hidden' },
  bestTitle: { flex: 1, fontFamily: fonts.display, fontSize: 19, lineHeight: 22 },
  bestNums: { fontSize: 12, textAlign: 'right' },
  note: { fontSize: 12, lineHeight: 17 },
});
