import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { FeedGrid } from '@/components/feed-grid';
import { CheckIcon } from '@/components/icons';
import { NicheHeader } from '@/components/niche-header';
import { NichePager } from '@/components/niche-swipe';
import { PostCard } from '@/components/post-card';
import { Button, DisplayText } from '@/components/primitives';
import { NicheShop } from '@/components/shop';
import { SHOP_NICHES } from '@/lib/shop';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { isVisible, useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, type Niche } from '@/lib/theme';
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
          if (hasShop && state.homeMode === 'shop') {
            return (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                {top}
                <NicheShop niche={niche} />
              </ScrollView>
            );
          }
          return niche.open ? <OpenFeed niche={niche} top={top} /> : <ComingSoon niche={niche} top={top} />;
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
    const all = state.posts.filter((p) => p.niche === niche.id && isVisible(state, p)).sort((a, b) => b.createdAt - a.createdAt);
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
    <View accessibilityRole="tablist" style={styles.modeRow}>
      {(['feed', 'shop'] as const).map((m) => {
        const on = state.homeMode === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => actions.setHomeMode(m)}
            style={[styles.modeTab, { borderBottomColor: on ? niche.accent : 'transparent' }]}>
            <Text style={[styles.modeText, { color: on ? niche.ink : colors.textMuted }]}>{m === 'feed' ? 'Feed' : 'Shop'}</Text>
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
      <View style={styles.metaBar}>
        <Text style={styles.metaText}>Newest first</Text>
        <Text style={styles.metaText}>{fresh.length} new since yesterday</Text>
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
          />
        </View>
      ) : null}

      {showOlder ? (
        <>
          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text style={styles.dividerText}>Older than a day</Text>
            <View style={styles.rule} />
          </View>
          <FeedSection posts={older} layout={state.layout} />
          <Text style={styles.endText}>That’s everything in {niche.label}.</Text>
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
  return (
    <View style={[styles.caughtUp, { backgroundColor: niche.field }]} accessibilityRole="summary">
      <View style={[styles.check, { backgroundColor: niche.accent }]}>
        <CheckIcon />
      </View>
      <DisplayText size={26} color={niche.ink}>
        You’re caught up in {niche.label}
      </DisplayText>
      <Text style={styles.caughtUpBody}>
        {count === 0
          ? 'No new posts since yesterday. Be the first to share something today.'
          : `That’s all ${count} new ${count === 1 ? 'post' : 'posts'} since yesterday. Go make something, then come back and share it.`}
      </Text>
      <View style={{ gap: 8, marginTop: 4 }}>
        <Button label="Open your saves" color={niche.accent} onPress={() => router.navigate('/saved')} />
        <Button label="Share what you made" tone="inverse" color={niche.ink} onPress={() => router.navigate('/create')} />
      </View>
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
        <DisplayText size={28} color={niche.ink}>
          {niche.label} is coming soon
        </DisplayText>
        <Text style={styles.soonBody}>
          We open a niche once its first creators are posting, so it never feels empty.
          {all.length ? ' Here’s a preview from its founding creators.' : ''} Want to know the day {niche.label} opens?
        </Text>
        <Button
          label={notified ? 'We’ll tell you when it opens' : 'Notify me'}
          tone={notified ? 'inverse' : 'solid'}
          color={notified ? niche.ink : niche.accent}
          style={notified ? { borderWidth: 1, borderColor: colors.border } : null}
          onPress={() => actions.toggleNotify(niche.id)}
        />
        {all.length ? null : <Button tone="ghost" label="Request a different niche" onPress={() => router.navigate('/discover')} />}
      </View>

      {all.length ? (
        <>
          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text style={styles.dividerText}>Preview · founding creators</Text>
            <View style={styles.rule} />
          </View>
          <FeedSection posts={all} layout={state.layout} />
          <Text style={styles.endText}>That’s the whole preview. Posting opens soon.</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground, overflow: 'hidden' },
  modeRow: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  modeTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2.5 },
  modeText: { fontSize: 15, fontWeight: '700' },
  metaBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  metaText: { fontSize: 13, color: colors.textMuted },
  caughtUp: { margin: 20, padding: 22, paddingTop: 28, borderRadius: 24, gap: 14 },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  caughtUpBody: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  olderWrap: { paddingHorizontal: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
  rule: { flex: 1, height: 1, backgroundColor: '#E3E5E1' },
  dividerText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  endText: { textAlign: 'center', fontSize: 14, color: colors.textMuted, paddingVertical: 24 },
  soonWrap: { padding: 20, paddingTop: 24, gap: 14 },
  soonBody: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
