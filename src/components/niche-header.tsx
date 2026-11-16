import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NicheCard } from '@/components/discover-parts';
import { BagIcon, BellIcon, CalendarIcon, ChevronLeftIcon, GridLayoutIcon, PostsLayoutIcon } from '@/components/icons';
import { Sheet } from '@/components/sheet';
import { Text } from '@/components/text';
import { weekFavorites } from '@/lib/discover';
import { postPhoto } from '@/lib/demo-photos';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { SHOP_NICHES } from '@/lib/shop';
import { inFeeds, useNiches, useStore } from '@/lib/store';
import { fonts, NICHE_ORDER, TOUCH } from '@/lib/theme';

const ROW = 44;
/** Height of the big niche name; this is what folds away as you scroll. */
const TITLE = 84;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Full height of the Home header at the top of a feed; feeds leave this much room above their first post. */
export function useHeaderHeight() {
  return useSafeAreaInsets().top + 6 + ROW + TITLE + 8;
}

/**
 * The top of Home (founder's mix, Nov 2026). The niche name is the subject,
 * big and italic. There's no row of niche names: tap the name (or swipe) to
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

  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(-position.get() / width, stops, mids) }));
  // 0 at the top of the feed, 1 once the big name has folded away.
  const big = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, scroll.get() / TITLE));
    return { height: TITLE * (1 - p), opacity: interpolate(p, [0, 0.6], [1, 0], 'clamp') };
  });
  const eyebrow = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0, 0.5], [1, 0], 'clamp') }));
  const compact = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0.5, 1], [0, 1], 'clamp') }));
  const rule = useAnimatedStyle(() => ({ opacity: interpolate(scroll.get() / TITLE, [0.8, 1], [0, 1], 'clamp') }));

  // Long names ("Photography") shrink to fit on one line next to the dashes.
  const titleSize = Math.min(76, Math.floor((Math.min(width, 640) - 110) / (niche.label.length * 0.43)));
  const hasShop = SHOP_NICHES.includes(niche.id);
  const inShop = hasShop && state.homeMode === 'shop';
  const now = new Date();
  const fresh = state.posts.filter((p) => p.niche === niche.id && inFeeds(state, p) && now.getTime() - p.createdAt < FRESH_WINDOW_MS).length;
  const meta = inShop ? `${niche.label} shop` : `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}${niche.open ? ` · ${fresh} new` : ''}`;
  const open = () => setPicking(true);
  const label = `${niche.label}. Switch niche`;

  const dashes = (
    <View accessibilityRole="image" accessibilityLabel={`Niche ${index + 1} of ${NICHE_ORDER.length}`} style={styles.dashes}>
      {NICHE_ORDER.map((id, i) => (
        <View key={id} style={[styles.dash, { width: i === index ? 16 : 6, backgroundColor: i === index ? niche.ink : niche.line }]} />
      ))}
    </View>
  );
  const chevron = (size: number) => (
    <View style={{ transform: [{ rotate: '-90deg' }] }}>
      <ChevronLeftIcon size={size} color={niche.ink} />
    </View>
  );

  return (
    <Animated.View style={[styles.header, { paddingTop: insets.top + 6 }, bg]}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Animated.View style={[styles.leftLayer, eyebrow]} pointerEvents="none">
            <Text style={[styles.meta, { color: niche.inkSoft }]} numberOfLines={1}>{meta}</Text>
          </Animated.View>
          <Animated.View style={[styles.leftLayer, compact]}>
            {/* Also covers the date line at the top of the feed, so tapping there opens the niche list too. */}
            <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} style={styles.compact}>
              <Text style={[styles.compactTitle, { color: niche.ink }]} numberOfLines={1}>{niche.label}</Text>
              {chevron(16)}
              <View style={{ marginLeft: 6 }}>{dashes}</View>
            </Pressable>
          </Animated.View>
        </View>
        <View style={styles.icons}>
          {hasShop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: inShop }}
              accessibilityLabel={inShop ? `Back to the ${niche.label} feed` : `${niche.label} shop`}
              onPress={() => actions.setHomeMode(inShop ? 'feed' : 'shop')}
              style={styles.iconButton}>
              <BagIcon color={niche.ink} filled={inShop} />
            </Pressable>
          ) : null}
          {inShop ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={state.layout === 'posts' ? 'Show as a grid' : 'Show as posts'}
              onPress={() => actions.setLayout(state.layout === 'posts' ? 'grid' : 'posts')}
              style={styles.iconButton}>
              {state.layout === 'posts' ? <GridLayoutIcon size={19} color={niche.ink} /> : <PostsLayoutIcon size={19} color={niche.ink} />}
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Plans" onPress={() => router.push('/plans')} style={styles.iconButton}>
            <CalendarIcon color={niche.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Notification digest" style={styles.iconButton}>
            <BellIcon color={niche.ink} />
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.bigRow, big]}>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} style={styles.bigButton}>
          <Text accessibilityRole="header" style={[styles.bigTitle, { color: niche.ink, fontSize: titleSize, lineHeight: TITLE - 4 }]} numberOfLines={1}>
            {niche.label}
          </Text>
          <View style={{ marginTop: 14 }}>{chevron(20)}</View>
        </Pressable>
        <View style={{ paddingBottom: 22 }}>{dashes}</View>
      </Animated.View>
      <Animated.View style={[styles.rule, { backgroundColor: niche.line }, rule]} />

      <Sheet visible={picking} onClose={() => setPicking(false)} title="Your niches · or swipe left and right">
        <View style={styles.pickGrid}>
          {NICHE_ORDER.map((id) => (
            <NicheCard
              key={id}
              niche={NICHES[id]}
              posts={weekFavorites(state, [id], 3).posts.filter((p) => p.kind !== 'text' && postPhoto(p))}
              notified={!!state.notify[id]}
              current={id === state.niche}
              width={Math.floor((Math.min(width, 560) - 34 - 12) / 2)}
              onPress={() => {
                setPicking(false);
                actions.setNiche(id);
              }}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setPicking(false);
            router.navigate('/discover');
          }}
          style={styles.request}>
          <Text style={styles.requestText}>Missing a niche? Request one</Text>
        </Pressable>
      </Sheet>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, overflow: 'hidden' },
  topRow: { height: ROW, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8 },
  left: { flex: 1, height: ROW },
  leftLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center' },
  meta: { fontSize: 12, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  compact: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', maxWidth: '100%' },
  compactTitle: { fontFamily: fonts.displayItalic, fontSize: 28, lineHeight: 32, flexShrink: 1 },
  icons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  bigRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  bigButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: TITLE, flexShrink: 1 },
  bigTitle: { fontFamily: fonts.displayItalic, letterSpacing: -1, flexShrink: 1 },
  dashes: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dash: { height: 4, borderRadius: 2 },
  rule: { height: 1, marginTop: 7 },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 12, paddingHorizontal: 0, paddingBottom: 6 },
  request: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  requestText: { fontSize: 14, fontWeight: '600', color: '#3E444B', textDecorationLine: 'underline' },
});
