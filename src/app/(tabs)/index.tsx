import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { FeedGrid } from '@/components/feed-grid';
import { FeedPost } from '@/components/feed-post';
import { NicheHeader, useHeaderHeight } from '@/components/niche-header';
import { NichePager } from '@/components/niche-swipe';
import { Button, DisplayText } from '@/components/primitives';
import { NicheShop } from '@/components/shop';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { SurfaceProvider, useSurface } from '@/components/surface';
import { SHOP_NICHES } from '@/lib/shop';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { useTabReselect } from '@/lib/tab-events';
import { inFeeds, useNiches, useStore } from '@/lib/store';
import { floodSurface, NICHE_ORDER, type Niche, type NicheId } from '@/lib/theme';
import type { Post } from '@/lib/types';

export default function HomeScreen() {
  const { state } = useStore();
  const niches = useNiches();
  // x offset of the row of niche pages; the header blends its color from it.
  const position = useSharedValue(0);
  // How far each niche's page is scrolled; the header folds its big title away from the current one.
  const s0 = useSharedValue(0);
  const s1 = useSharedValue(0);
  const s2 = useSharedValue(0);
  const s3 = useSharedValue(0);
  const scrolls = [s0, s1, s2, s3];

  return (
    <View style={styles.screen}>
      <NichePager
        position={position}
        renderPage={(id) => {
          const niche = niches[id];
          const scroll = scrolls[NICHE_ORDER.indexOf(id)];
          const hasShop = SHOP_NICHES.includes(id);
          // Each niche's page carries its own flood color, so the next niche slides in already tinted.
          return (
            <SurfaceProvider value={floodSurface(niche)}>
              <View style={{ flex: 1, backgroundColor: niche.mid }}>
                {hasShop && state.homeMode === 'shop' ? (
                  <PageScroll scroll={scroll} nicheId={id}>
                    <NicheShop niche={niche} />
                  </PageScroll>
                ) : niche.open ? (
                  <OpenFeed niche={niche} scroll={scroll} />
                ) : (
                  <ComingSoon niche={niche} scroll={scroll} />
                )}
              </View>
            </SurfaceProvider>
          );
        }}
      />
      <NicheHeader position={position} scrolls={scrolls} />
    </View>
  );
}

/** A niche page's scroll view: starts below the header, ends clear of the floating tab bar, and reports its offset. */
function PageScroll({ scroll, nicheId, children }: { scroll: SharedValue<number>; nicheId: NicheId; children: ReactNode }) {
  const top = useHeaderHeight();
  const { state } = useStore();
  const ref = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  // Tap Home while on Home: the niche you're looking at glides back to the top.
  useTabReselect('index', () => {
    if (state.niche === nicheId) ref.current?.scrollTo({ y: 0, animated: true });
  });
  const onScroll = useAnimatedScrollHandler((e) => {
    scroll.set(e.contentOffset.y);
  });
  // Pull down at the top to refresh, like Instagram (founder, Nov 2026). The
  // header stays put and the posts pull away from it, so the spinner shows in
  // the gap right under the header from the first bit of the pull (iPhone's own
  // spinner sat behind the header until you pulled very far). Android keeps its
  // own spinner, placed below the header. In the demo it just re-reads the feed.
  const ios = Platform.OS === 'ios';
  const niche = useNiches()[nicheId];
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 900);
  };
  const spinner = useAnimatedStyle(() => {
    const pull = -scroll.get();
    return {
      opacity: refreshing ? 1 : interpolate(pull, [8, 48], [0, 1], 'clamp'),
      transform: [{ scale: refreshing ? 1 : interpolate(pull, [8, 60], [0.6, 1], 'clamp') }],
    };
  });
  return (
    <View style={{ flex: 1 }}>
    <Animated.ScrollView
      ref={ref}
      style={{ flex: 1 }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ios ? 'transparent' : niche.ink} colors={[niche.ink]} progressBackgroundColor="#FFFFFF" progressViewOffset={top} />}
      contentContainerStyle={{ paddingTop: top + 4, paddingBottom: TAB_BAR_SPACE }}>
      {children}
    </Animated.ScrollView>
    {ios ? (
      <Animated.View pointerEvents="none" style={[styles.pullSpinner, { top: top + 10 }, spinner]}>
        <ActivityIndicator color={niche.ink} />
      </Animated.View>
    ) : null}
    </View>
  );
}

/** Every visible post in this niche, newest first, split at the 24-hour mark. */
function useNicheFeed(niche: Niche) {
  const { state } = useStore();
  return useMemo(() => {
    const now = Date.now();
    const all = state.posts.filter((p) => p.niche === niche.id && inFeeds(state, p)).sort((a, b) => b.createdAt - a.createdAt);
    return {
      fresh: all.filter((p) => now - p.createdAt < FRESH_WINDOW_MS),
      older: all.filter((p) => now - p.createdAt >= FRESH_WINDOW_MS),
      all,
    };
  }, [state, niche.id]);
}

function OpenFeed({ niche, scroll }: { niche: Niche; scroll: SharedValue<number> }) {
  const { state } = useStore();
  const { all } = useNicheFeed(niche);

  // One continuous feed, newest first (founder, Nov 2026): no "older posts"
  // button, no divider, no end card. It stops after the last post.
  return (
    <PageScroll scroll={scroll} nicheId={niche.id}>
      <FeedSection posts={all} layout={state.layout} />
      {all.length === 0 ? <Text style={[styles.endText, { color: niche.inkSoft, paddingTop: 8 }]}>No {niche.label} posts yet.</Text> : null}
    </PageScroll>
  );
}

function FeedSection({ posts, layout }: { posts: Post[]; layout: 'posts' | 'grid' }) {
  if (posts.length === 0) return null;
  if (layout === 'grid') return <FeedGrid posts={posts} />;
  return (
    <View>
      {posts.map((p) => (
        <FeedPost key={p.id} post={p} />
      ))}
    </View>
  );
}

function Divider({ label }: { label: string }) {
  const surface = useSurface();
  return (
    <View style={styles.divider}>
      <View style={[styles.rule, { backgroundColor: surface.line }]} />
      <Text style={[styles.dividerText, { color: surface.muted }]}>{label}</Text>
      <View style={[styles.rule, { backgroundColor: surface.line }]} />
    </View>
  );
}

/** Niches that aren't open yet: a notify button, plus a preview from founding creators if there is one. */
function ComingSoon({ niche, scroll }: { niche: Niche; scroll: SharedValue<number> }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const notified = !!state.notify[niche.id];
  const { all } = useNicheFeed(niche);

  return (
    <PageScroll scroll={scroll} nicheId={niche.id}>
      <View style={styles.soonWrap}>
        <DisplayText italic size={36} color={niche.ink}>
          {niche.label} is coming soon
        </DisplayText>
        <Text style={[styles.soonBody, { color: niche.ink }]}>
          We open a niche once its first creators are posting, so it never feels empty.
          {all.length ? ' Here’s a preview from its founding creators.' : ''} Want to know the day {niche.label} opens?
        </Text>
        <Button
          label={notified ? 'We’ll tell you when it opens' : 'Notify me'}
          tone={notified ? 'inverse' : 'solid'}
          color={niche.ink}
          onPress={() => actions.toggleNotify(niche.id)}
        />
        {all.length ? null : <Button tone="ghost" label="Request a different niche" textStyle={{ color: niche.ink }} onPress={() => router.navigate('/discover')} />}
      </View>

      {all.length ? (
        <>
          <Divider label="Preview · founding creators" />
          <View style={{ height: 12 }} />
          <FeedSection posts={all} layout={state.layout} />
          <Text style={[styles.endText, { color: niche.inkSoft }]}>That’s the whole preview. Posting opens soon.</Text>
        </>
      ) : null}
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  pullSpinner: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  screen: { flex: 1, overflow: 'hidden' },
  modeRow: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1 },
  modeTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2.5 },
  modeText: { fontSize: 15, fontWeight: '700' },
  metaBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  metaText: { fontSize: 13, fontWeight: '500' },
  caughtUp: { margin: 16, padding: 22, paddingTop: 26, borderRadius: 28, gap: 12, backgroundColor: '#FFFFFF' },
  weekGoals: { borderRadius: 18, padding: 14, gap: 6 },
  weekGoalsLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  weekGoalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  weekGoalTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  weekGoalCount: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  caughtUpBody: { fontSize: 15, lineHeight: 22 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
  rule: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  endText: { textAlign: 'center', fontSize: 14, paddingVertical: 24 },
  soonWrap: { padding: 20, paddingTop: 24, gap: 14 },
  soonBody: { fontSize: 15, lineHeight: 22 },
});
