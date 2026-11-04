import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, DownloadIcon } from '@/components/icons';
import { Avatar, Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { FEE_RATE, formatPrice, statusLabel, type Order } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

type Tab = 'purchases' | 'sales';

/** Your purchases and, if you sell, your sales and earnings. */
export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const meId = state.me?.id;
  const purchases = state.orders.filter((o) => o.buyerId === meId);
  const sales = state.orders.filter((o) => o.sellerId === meId);
  const [tab, setTab] = useState<Tab>(purchases.length || !sales.length ? 'purchases' : 'sales');
  const accent = niches[state.niche].accent;
  const earnings = sales.reduce((n, o) => n + o.subtotalCents - o.feeCents, 0);
  const shown = tab === 'purchases' ? purchases : sales;

  const nicheOf = (o: Order) => state.listings.find((l) => l.id === o.lines[0]?.listingId)?.niche ?? state.niche;

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Your orders</Text>
        <View style={{ width: TOUCH }} />
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['purchases', 'sales'] as Tab[]).map((t) => {
          const on = t === tab;
          const n = t === 'purchases' ? purchases.length : sales.length;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: on ? colors.text : 'transparent' }]}>
              <Text style={[styles.tabText, { color: on ? colors.text : '#6B7178' }]}>
                {t === 'purchases' ? 'Purchases' : 'Sales'} · {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: insets.bottom + 40 }}>
        {tab === 'sales' && sales.length ? (
          <View style={[styles.earnings, { backgroundColor: niches[state.niche].field }]}>
            <Text style={[styles.earningsLabel, { color: niches[state.niche].inkSoft }]}>Earnings after Niches’ {Math.round(FEE_RATE * 100)}% fee (demo)</Text>
            <Text style={[styles.earningsValue, { color: niches[state.niche].ink }]}>{formatPrice(earnings)}</Text>
          </View>
        ) : null}

        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tab === 'purchases' ? 'No purchases yet' : 'No sales yet'}</Text>
            <Text style={styles.emptyBody}>
              {tab === 'purchases'
                ? 'Cookbooks, prints and artwork you buy show up here.'
                : 'List something in a niche’s Shop. When someone buys it, you’ll see it here and mark it shipped.'}
            </Text>
            <Button label={tab === 'purchases' ? 'Browse the shops' : 'Sell something'} color={accent} onPress={() => (tab === 'purchases' ? (actions.setHomeMode('shop'), router.navigate('/')) : router.push('/shop/new'))} />
          </View>
        ) : (
          shown.map((o) => {
            const other = usersById[tab === 'purchases' ? o.sellerId : o.buyerId];
            const niche = niches[nicheOf(o)];
            const digital = o.lines.every((l) => l.format === 'digital');
            return (
              <View key={o.id} style={[styles.order, { borderColor: niche.accent }]}>
                <View style={styles.orderHead}>
                  <Avatar user={other} size={28} />
                  <Text style={styles.orderWho} numberOfLines={1}>
                    {tab === 'purchases' ? `From ${other?.username}` : `Sold to ${other?.username}`}
                  </Text>
                  <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
                {o.lines.map((l) => (
                  <Pressable key={l.listingId} accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/[id]', params: { id: l.listingId } })} style={styles.orderLine}>
                    <Text style={styles.orderItem} numberOfLines={1}>
                      {l.qty > 1 ? `${l.qty} × ` : ''}
                      {l.title}
                    </Text>
                    <Text style={styles.orderPrice}>{formatPrice(l.priceCents * l.qty)}</Text>
                  </Pressable>
                ))}
                <Text style={styles.orderTotals}>
                  {tab === 'purchases'
                    ? `Total ${formatPrice(o.subtotalCents + o.shippingCents)}${o.shippingCents ? ` incl. ${formatPrice(o.shippingCents)} shipping` : ''}`
                    : `You earn ${formatPrice(o.subtotalCents - o.feeCents)} · fee ${formatPrice(o.feeCents)}${o.shippingCents ? ` · shipping ${formatPrice(o.shippingCents)} to you` : ''}`}
                </Text>
                {tab === 'sales' && o.shipTo ? <Text style={styles.shipTo}>Ship to: {o.shipTo}</Text> : null}
                <View style={styles.orderFoot}>
                  <Text style={[styles.status, { color: o.status === 'paid' ? niche.ink : colors.textSecondary }]}>{statusLabel(o)}</Text>
                  {tab === 'purchases' && digital ? (
                    <Pressable accessibilityRole="button" onPress={() => toast('Demo: your download would start here')} style={[styles.action, { borderColor: niche.accent }]}>
                      <DownloadIcon size={14} color={niche.accent} />
                      <Text style={[styles.actionText, { color: niche.accent }]}>Download</Text>
                    </Pressable>
                  ) : null}
                  {tab === 'sales' && o.status === 'paid' ? (
                    <Pressable accessibilityRole="button" onPress={() => { actions.setOrderStatus(o.id, 'shipped'); toast('Marked as shipped. The buyer gets a notice.'); }} style={[styles.action, { backgroundColor: niche.accent, borderColor: niche.accent }]}>
                      <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Mark shipped</Text>
                    </Pressable>
                  ) : null}
                  {tab === 'purchases' && o.status === 'shipped' ? (
                    <Pressable accessibilityRole="button" onPress={() => actions.setOrderStatus(o.id, 'delivered')} style={[styles.action, { borderColor: niche.accent }]}>
                      <Text style={[styles.actionText, { color: niche.accent }]}>It arrived</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  earnings: { padding: 16, borderRadius: 16, gap: 4 },
  earningsLabel: { fontSize: 13, fontWeight: '600' },
  earningsValue: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  empty: { padding: 20, borderRadius: 18, backgroundColor: colors.surface, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  order: { borderWidth: 3, borderRadius: 18, padding: 14, gap: 8 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderWho: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  orderDate: { fontSize: 13, color: colors.textMuted },
  orderLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, minHeight: 28, alignItems: 'center' },
  orderItem: { flex: 1, fontSize: 15, color: colors.text },
  orderPrice: { fontSize: 15, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  orderTotals: { fontSize: 13, color: colors.textMuted },
  shipTo: { fontSize: 13, color: colors.textSecondary },
  orderFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  status: { fontSize: 14, fontWeight: '700' },
  action: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '700' },
});
