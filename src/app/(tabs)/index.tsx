import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedGrid } from '@/components/feed-grid';
import { CheckIcon } from '@/components/icons';
import { NicheHeader } from '@/components/niche-header';
import { PostCard } from '@/components/post-card';
import { Button, DisplayText } from '@/components/primitives';
import { FRESH_WINDOW_MS } from '@/lib/seed';
import { useStore } from '@/lib/store';
import { colors, NICHES, type Niche } from '@/lib/theme';
import type { Post } from '@/lib/types';

export default function HomeScreen() {
  const { state } = useStore();
  const niche = NICHES[state.niche];

  return (
    <View style={styles.screen}>
      <NicheHeader />
      {niche.open ? <OpenFeed key={niche.id} niche={niche} /> : <ComingSoon key={niche.id} niche={niche} />}
    </View>
  );
}

function OpenFeed({ niche }: { niche: Niche }) {
  const { state } = useStore();
  const [showOlder, setShowOlder] = useState(false);

  // Every post in this niche, newest first. No ranking.
  const { fresh, older } = useMemo(() => {
    const now = Date.now();
    const all = state.posts.filter((p) => p.niche === niche.id).sort((a, b) => b.createdAt - a.createdAt);
    return {
      fresh: all.filter((p) => now - p.createdAt < FRESH_WINDOW_MS),
      older: all.filter((p) => now - p.createdAt >= FRESH_WINDOW_MS),
    };
  }, [state.posts, niche.id]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
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
        <Button label="Open your boards" color={niche.accent} onPress={() => router.navigate('/saved')} />
        <Button label="Share what you made" tone="inverse" color={niche.ink} onPress={() => router.navigate('/create')} />
      </View>
    </View>
  );
}

function ComingSoon({ niche }: { niche: Niche }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const notified = !!state.notify[niche.id];
  return (
    <ScrollView contentContainerStyle={styles.soonWrap}>
      <DisplayText size={28} color={niche.ink}>
        {niche.label} is coming soon
      </DisplayText>
      <Text style={styles.soonBody}>
        We open a niche once its first creators are posting, so it never feels empty. Want to know the day {niche.label} opens?
      </Text>
      <Button
        label={notified ? 'We’ll tell you when it opens' : 'Notify me'}
        tone={notified ? 'inverse' : 'solid'}
        color={notified ? niche.ink : niche.accent}
        style={notified ? { borderWidth: 1, borderColor: colors.border } : null}
        onPress={() => actions.toggleNotify(niche.id)}
      />
      <Button tone="ghost" label="Request a different niche" onPress={() => router.navigate('/discover')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
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
  soonWrap: { padding: 20, paddingTop: 28, gap: 14 },
  soonBody: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
