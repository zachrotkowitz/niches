import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSharedValue } from 'react-native-reanimated';

import { FeedGrid } from '@/components/feed-grid';
import { NicheHeader } from '@/components/niche-header';
import { NichePager } from '@/components/niche-swipe';
import { PostCard } from '@/components/post-card';
import { Button, DisplayText } from '@/components/primitives';
import { NicheShop } from '@/components/shop';
import { SurfaceProvider, useSurface } from '@/components/surface';
import { progress } from '@/lib/goals';
import { SHOP_NICHES } from '@/lib/shop';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { inFeeds, useNiches, useStore } from '@/lib/store';
import { floodSurface, NICHE_ORDER, type Niche } from '@/lib/theme';
import type { Post } from '@/lib/types';

export default function HomeScreen() {
  const { state } = useStore();
  const niches = useNiches();
  // x offset of the row of niche pages; the header blends its color from it.
  const position = useSharedValue(0);

  return (
    <View style={styles.screen}>
      <NicheHeader position={position} />
      <NichePager
        position={position}
        renderPage={(id) => {
          const niche = niches[id];
          const hasShop = SHOP_NICHES.includes(id);
          const top = hasShop ? <FeedShopSwitch niche={niche} /> : null;
          // Each niche's page carries its own flood color, so the next niche slides in already tinted.
          return (
            <SurfaceProvider value={floodSurface(niche)}>
              <View style={{ flex: 1, backgroundColor: niche.mid }}>
                {hasShop && state.homeMode === 'shop' ? (
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                    {top}
                    <NicheShop niche={niche} />
                  </ScrollView>
                ) : niche.open ? (
                  <OpenFeed niche={niche} top={top} />
                ) : (
                  <ComingSoon niche={niche} top={top} />
                )}
              </View>
            </SurfaceProvider>
          );
        }}
      />
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

/** Feed | Shop switch at the top of niches that have a shop. */
function FeedShopSwitch({ niche }: { niche: Niche }) {
  const { state, actions } = useStore();
  return (
    <View accessibilityRole="tablist" style={[styles.modeRow, { borderBottomColor: niche.line }]}>
      {(['feed', 'shop'] as const).map((m) => {
        const on = state.homeMode === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => actions.setHomeMode(m)}
            style={[styles.modeTab, { borderBottomColor: on ? niche.ink : 'transparent' }]}>
            <Text style={[styles.modeText, { color: on ? niche.ink : niche.inkSoft }]}>{m === 'feed' ? 'Feed' : 'Shop'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OpenFeed({ niche, top }: { niche: Niche; top?: ReactNode }) {
  const { state } = useStore();
  const [showOlder, setShowOlder] = useState(false);
  const { fresh, older } = useNicheFeed(niche);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      {top}
      <View style={[styles.metaBar, { borderBottomColor: niche.line }]}>
        <Text style={[styles.metaText, { color: niche.inkSoft }]}>Newest first</Text>
        <Text style={[styles.metaText, { color: niche.inkSoft }]}>{fresh.length} new since yesterday</Text>
      </View>

      <FeedSection posts={fresh} layout={state.layout} />

      <CaughtUp niche={niche} count={fresh.length} />

      {older.length > 0 ? (
        <View style={styles.olderWrap}>
          <Button
            tone="outline"
            label={showOlder ? 'Hide older posts' : `Show older posts (${older.length})`}
            onPress={() => setShowOlder((v) => !v)}
            accessibilityState={{ expanded: showOlder }}
            style={{ borderColor: niche.line, backgroundColor: 'rgba(255,255,255,0.35)' }}
            textStyle={{ color: niche.ink }}
          />
        </View>
      ) : null}

      {showOlder ? (
        <>
          <Divider label="Older than a day" />
          <FeedSection posts={older} layout={state.layout} />
          <Text style={[styles.endText, { color: niche.inkSoft }]}>That’s everything in {niche.label}.</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function FeedSection({ posts, layout }: { posts: Post[]; layout: 'posts' | 'grid' }) {
  if (posts.length === 0) return null;
  if (layout === 'grid') return <FeedGrid posts={posts} />;
  return (
    <View>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </View>
  );
}

/** The feed has a real end. Nothing else loads unless you ask. */
function CaughtUp({ niche, count }: { niche: Niche; count: number }) {
  const router = useRouter();
  const { state } = useStore();
  // Instead of more posts: a nudge toward your own week.
  const weekly = state.goals.filter((g) => g.userId === state.me?.id && g.niche === niche.id && g.kind === 'habit' && !g.doneAt);
  return (
    <View style={styles.caughtUp} accessibilityRole="summary">
      <DisplayText italic size={42} color={niche.accent}>
        You’re caught up.
      </DisplayText>
      <Text style={[styles.caughtUpBody, { color: niche.ink }]}>
        {count === 0
          ? `No new ${niche.label} posts since yesterday. Be the first to share something today.`
          : `That’s all ${count} new ${niche.label} ${count === 1 ? 'post' : 'posts'} since yesterday. Go make something, then come back and share it.`}
      </Text>
      {weekly.length ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(weekly.length === 1 ? { pathname: '/goals/[id]', params: { id: weekly[0].id } } : '/goals')} style={[styles.weekGoals, { backgroundColor: niche.field }]}>
          <Text style={[styles.weekGoalsLabel, { color: niche.inkSoft }]}>Your week</Text>
          {weekly.slice(0, 3).map((g) => {
            const p = progress(g);
            return (
              <View key={g.id} style={styles.weekGoalRow}>
                <Text style={[styles.weekGoalTitle, { color: niche.ink }]} numberOfLines={1}>{g.title}</Text>
                <Text style={[styles.weekGoalCount, { color: niche.ink }]}>{p.headline}</Text>
              </View>
            );
          })}
        </Pressable>
      ) : null}
      <View style={{ gap: 8, marginTop: 4 }}>
        <Button label="Open your saves" color={niche.ink} onPress={() => router.navigate('/saved')} />
        <Button label="Share what you made" tone="outline" textStyle={{ color: niche.ink }} style={{ borderColor: niche.line }} onPress={() => router.navigate('/create')} />
      </View>
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
function ComingSoon({ niche, top }: { niche: Niche; top?: ReactNode }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const notified = !!state.notify[niche.id];
  const { all } = useNicheFeed(niche);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {top}
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
          <FeedSection posts={all} layout={state.layout} />
          <Text style={[styles.endText, { color: niche.inkSoft }]}>That’s the whole preview. Posting opens soon.</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  olderWrap: { paddingHorizontal: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
  rule: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  endText: { textAlign: 'center', fontSize: 14, paddingVertical: 24 },
  soonWrap: { padding: 20, paddingTop: 24, gap: 14 },
  soonBody: { fontSize: 15, lineHeight: 22 },
});
