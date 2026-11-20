import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BagIcon, ChevronLeftIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { ListingGrid, shelfListings } from '@/components/shop';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { SHOP_NICHES } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, floodSurface, fonts, TOUCH, type NicheId } from '@/lib/theme';

/**
 * A shop shelf's "See all", and the shop search (founder, Nov 20 2026): the
 * shelves on Home open into A's Etsy-style grid, two across, with the price
 * and seller under each photo. On the niche's own color, like the shop itself.
 */
export default function ShopBrowse() {
  const params = useLocalSearchParams<{ niche?: NicheId; section?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById } = useStore();
  const niches = useNiches();
  const nicheId: NicheId = params.niche && SHOP_NICHES.includes(params.niche) ? params.niche : 'cooking';
  const niche = niches[nicheId];
  const surface = floodSurface(niche);
  const searching = params.section === 'search';
  const [query, setQuery] = useState('');
  const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);

  const all = state.listings.filter((l) => l.niche === nicheId);
  const shelf = shelfListings(all, state.following, searching ? 'all' : params.section ?? 'all');
  const q = query.trim().toLowerCase();
  const items = q
    ? all.filter((l) => [l.title, l.description, l.category, usersById[l.sellerId]?.username ?? ''].some((t) => t.toLowerCase().includes(q)))
    : shelf.items;
  const title = searching ? `${niche.label} shop` : shelf.title === 'Everything' ? `Everything in ${niche.label}` : shelf.title;

  return (
    <SurfaceProvider value={surface}>
      <View style={{ flex: 1, backgroundColor: niche.mid }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <View style={styles.nav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to the shop" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.iconButton}>
              <ChevronLeftIcon color={niche.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${cartCount} items`} onPress={() => router.push('/shop/cart')} style={styles.iconButton}>
              <BagIcon color={niche.ink} />
              {cartCount ? (
                <View style={[styles.badge, { backgroundColor: niche.ink }]}>
                  <Text style={[styles.badgeText, { color: niche.mid }]}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: niche.ink }]}>{title}</Text>
          <View style={styles.search}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              accessibilityLabel={`Search the ${niche.label} shop`}
              value={query}
              onChangeText={setQuery}
              autoFocus={searching}
              placeholder={`Search the ${niche.label} shop`}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              selectionColor={niche.ink}
              style={[styles.searchInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                <CloseIcon size={14} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          {items.length ? (
            <ListingGrid listings={items} />
          ) : (
            <Text style={[styles.none, { color: niche.inkSoft }]}>{q ? `Nothing called “${query.trim()}” in the ${niche.label} shop.` : 'Nothing here yet.'}</Text>
          )}
        </ScrollView>
      </View>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 6, right: 4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  title: { fontFamily: fonts.displayItalic, fontSize: 40, lineHeight: 44, paddingHorizontal: 20, marginTop: 2 },
  search: { marginHorizontal: 20, marginTop: 12, marginBottom: 4, minHeight: 46, borderRadius: 23, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10 },
  none: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32, paddingTop: 32 },
});
