import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, FadeOut, ReduceMotion, interpolate, interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BagIcon, BellIcon, CalendarIcon, CheckIcon, ChevronLeftIcon, GridLayoutIcon, PostsLayoutIcon } from '@/components/icons';
import { NicheName, SCRIPT_EM } from '@/components/niche-name';
import { Text } from '@/components/text';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { SHOP_NICHES } from '@/lib/shop';
import { inFeeds, useNiches, useStore } from '@/lib/store';
import { fonts, NICHE_ORDER, TOUCH } from '@/lib/theme';

const ROW = 44;
/** Height of the big niche name; this is what folds away as you scroll. */
const TITLE = 126;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Full height of the Home header at the top of a feed; feeds leave this much room above their first post. */
export function useHeaderHeight() {
  return useSafeAreaInsets().top + 6 + ROW + TITLE + 8;
}

/**
 * The top of Home (founder's mix, Nov 2026). The niche name is the subject,
 * big, in script (new look, Nov 26 2026). There's no row of niche names: tap the name (or swipe) to
 * change niche, and four small dashes show which one you're on. As the feed
 * scrolls, the big name folds into one slim bar so posts get the screen.
 *
 * `position` is the pager's x offset (the color blends between niches as you
 * drag); `scrolls` holds each niche page's scroll offset.
 */
export function NicheHeader({ position, scrolls }: { position: SharedValue<number>; scrolls: SharedValue<number>[] }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const niche = NICHES[state.niche];
  const index = NICHE_ORDER.indexOf(state.niche);
  const { width } = useWindowDimensions();
  const [picking, setPicking] = useState(false);
  const mids = NICHE_ORDER.map((id) => NICHES[id].mid);
  const stops = NICHE_ORDER.map((_, i) => i);
  const scroll = scrolls[index];

  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(-position.get() / width, stops, mids),
  }));
  // 0 at the top of the feed, 1 once the big name has folded away.
  const big = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, scroll.get() / TITLE));
    return { height: TITLE * (1 - p), opacity: interpolate(p, [0, 0.6], [1, 0], 'clamp') };
  });
  const eyebrow = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0, 0.5], [1, 0], 'clamp') }));
  const compact = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0.5, 1], [0, 1], 'clamp') }));
  const rule = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0.8, 1], [0, 1], 'clamp') }));

  // Long names ("Photography") shrink to fit on one line next to the dashes.
  const hasShop = SHOP_NICHES.includes(niche.id);
  const inShop = hasShop && state.homeMode === 'shop';
  // In the shop the big title is just "Cooking shop" (founder, Nov 20 2026).
  const title = inShop ? `${niche.label} shop` : niche.label;
  const titleSize = Math.min(74, Math.floor((Math.min(width, 640) - 110) / (title.length * SCRIPT_EM)));
  const cartCount = state.cart.reduce((n, c) => n + c.qty, 0);
  const now = new Date();
  const fresh = state.posts.filter((p) => p.niche === niche.id && inFeeds(state, p) && now.getTime() - p.createdAt < FRESH_WINDOW_MS).length;
  const meta = inShop ? `${niche.label} shop` : `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}${niche.open ? ` · ${fresh} new` : ''}`;
  // Where the menu drops from: just under the big name, or under the slim bar once it has folded.
  const [menuTop, setMenuTop] = useState(0);
  const open = () => {
    const folded = Math.min(1, Math.max(0, scroll.get() / TITLE));
    setMenuTop(insets.top + 6 + ROW + TITLE * (1 - folded) + 4);
    setPicking(true);
  };
  const close = () => setPicking(false);
  const pick = (id: (typeof NICHE_ORDER)[number]) => {
    close();
    if (id === state.niche) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    actions.setNiche(id);
  };
  const label = `${niche.label}. Switch niche`;

  const dashes = (
    <View accessibilityRole="image" accessibilityLabel={`Niche ${index + 1} of ${NICHE_ORDER.length}`} style={styles.dashes}>
      {NICHE_ORDER.map((id, i) => (
        <View key={id} style={[styles.dash, { width: i === index ? 16 : 6, backgroundColor: i === index ? niche.onFlood : `${niche.onFlood}55` }]} />
      ))}
    </View>
  );
  const chevron = (size: number) => (
    <View style={{ transform: [{ rotate: picking ? '90deg' : '-90deg' }] }}>
      <ChevronLeftIcon size={size} color={niche.onFlood} />
    </View>
  );

  return (
    <Animated.View style={[styles.header, { paddingTop: insets.top + 6 }, bg]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {inShop ? (
            <Animated.View style={[styles.leftLayer, eyebrow]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Back to the ${niche.label} feed`} onPress={() => actions.setHomeMode('feed')} hitSlop={8} style={styles.backToFeed}>
                <ChevronLeftIcon size={15} color={niche.onFloodSoft} />
                <Text style={[styles.meta, { color: niche.onFloodSoft }]} numberOfLines={1}>{niche.label} feed</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.leftLayer, eyebrow]} pointerEvents="none">
              <Text style={[styles.meta, { color: niche.onFloodSoft }]} numberOfLines={1}>{meta}</Text>
            </Animated.View>
          )}
          <Animated.View style={[styles.leftLayer, compact]}>
            {/* Also covers the date line at the top of the feed, so tapping there opens the niche list too. */}
            <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} style={styles.compact}>
              <NicheName name={title} size={26} color={niche.onFlood} style={styles.compactTitle} />
              {chevron(16)}
              <View style={{ marginLeft: 6 }}>{dashes}</View>
            </Pressable>
          </Animated.View>
        </View>
        {inShop ? (
          // In the shop: your own shop, your orders and the cart (founder liked these up top).
          <Animated.View key="shop" entering={FadeIn.duration(220)} style={styles.icons}>
            <Pressable accessibilityRole="link" onPress={() => router.push('/shop/dashboard')} style={styles.textLink}>
              <Text style={[styles.textLinkText, { color: niche.onFlood }]}>Your shop</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => router.push('/shop/orders')} style={styles.textLink}>
              <Text style={[styles.textLinkText, { color: niche.onFlood }]}>Orders</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} onPress={() => router.push('/shop/cart')} style={styles.iconButton}>
              <BagIcon color={niche.onFlood} />
              {cartCount ? (
                <View style={[styles.cartBadge, { backgroundColor: niche.onFlood }]}>
                  <Text style={[styles.cartBadgeText, { color: niche.mid }]}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        ) : (
        <Animated.View key="feed" entering={FadeIn.duration(220)} style={styles.icons}>
          {hasShop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: inShop }}
              accessibilityLabel={inShop ? `Back to the ${niche.label} feed` : `${niche.label} shop`}
              onPress={() => actions.setHomeMode(inShop ? 'feed' : 'shop')}
              style={styles.iconButton}>
              <BagIcon color={niche.onFlood} filled={inShop} />
            </Pressable>
          ) : null}
          {inShop ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={state.layout === 'posts' ? 'Show as a grid' : 'Show as posts'}
              onPress={() => actions.setLayout(state.layout === 'posts' ? 'grid' : 'posts')}
              style={styles.iconButton}>
              {state.layout === 'posts' ? <GridLayoutIcon size={19} color={niche.onFlood} /> : <PostsLayoutIcon size={19} color={niche.onFlood} />}
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Plans" onPress={() => router.push('/plans')} style={styles.iconButton}>
            <CalendarIcon color={niche.onFlood} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Notification digest" style={styles.iconButton}>
            <BellIcon color={niche.onFlood} />
          </Pressable>
        </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.bigRow, big]}>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} style={styles.bigButton}>
          {/* The title fades to its new words when you open or leave the shop. */}
          <Animated.View key={title} entering={FadeIn.duration(220)} style={styles.bigTitle}>
            <NicheName name={title} size={titleSize} color={niche.onFlood} style={{ lineHeight: TITLE }} />
          </Animated.View>
          <View style={{ marginTop: 30 }}>{chevron(20)}</View>
        </Pressable>
        <View style={{ paddingBottom: 22 }}>{dashes}</View>
      </Animated.View>
      <Animated.View style={[styles.rule, { backgroundColor: niche.line }, rule]} />

      {/* Option A (founder, Nov 17 2026): a small white menu drops from under the name. Nothing behind it is dimmed; tap outside to close. */}
      <Modal visible={picking} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable accessibilityLabel="Close the niche list" style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View
          entering={FadeInUp.duration(200).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
          accessibilityRole="menu"
          style={[styles.menu, { top: menuTop, shadowColor: niche.ink }]}>
          {NICHE_ORDER.map((id, i) => {
            const n = NICHES[id];
            const current = id === state.niche;
            return (
              <Pressable
                key={id}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: current }}
                accessibilityLabel={n.open ? n.label : `${n.label}, opening soon`}
                onPress={() => pick(id)}
                style={({ pressed }) => [styles.menuRow, i > 0 && styles.menuDivider, { backgroundColor: pressed ? 'rgba(31,26,20,0.05)' : 'transparent', opacity: n.open || current ? 1 : 0.5 }]}>
                <View style={[styles.menuDot, { backgroundColor: n.second }]} />
                <Text style={styles.menuName} numberOfLines={1}>{n.label}</Text>
                {current ? <CheckIcon size={20} color={n.ink} strokeWidth={2.4} /> : n.open ? null : <Text style={styles.menuSoon}>Soon</Text>}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => {
              close();
              router.navigate('/discover');
            }}
            style={[styles.menuRequest, styles.menuDivider]}>
            <Text style={styles.requestText}>Request a niche</Text>
          </Pressable>
        </Animated.View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backToFeed: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
  textLink: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 6 },
  textLinkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  cartBadge: { position: 'absolute', top: 6, right: 4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, fontWeight: '800' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, overflow: 'hidden' },
  topRow: { height: ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8 },
  left: { flex: 1, height: ROW },
  leftLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  meta: { fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },
  compact: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', maxWidth: '100%' },
  compactTitle: { flexShrink: 1, lineHeight: 44 },
  icons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  bigRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  bigButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: TITLE, flexShrink: 1 },
  bigTitle: { flexShrink: 1 },
  dashes: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dash: { height: 4, borderRadius: 2 },
  rule: { height: 1, marginTop: 7 },
  menu: { position: 'absolute', left: 20, width: 270, borderRadius: 20, backgroundColor: '#FFFFFF', paddingVertical: 4, shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18 },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: 'rgba(31,26,20,0.08)' },
  menuDot: { width: 12, height: 12, borderRadius: 6 },
  menuName: { flex: 1, fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34, color: '#1F1A14' },
  menuSoon: { fontSize: 12, fontWeight: '700', color: '#655B4F' },
  menuRequest: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  requestText: { fontSize: 14, fontWeight: '600', color: '#3E444B', textDecorationLine: 'underline' },
});
