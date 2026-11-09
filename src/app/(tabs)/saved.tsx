import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedGrid } from '@/components/feed-grid';
import { NicheFilter } from '@/components/niche-filter';
import { Button, DisplayText } from '@/components/primitives';
import { ListingGrid } from '@/components/shop';
import { MediaPlaceholder } from '@/components/primitives';
import { diaryWords } from '@/lib/diary';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, type NicheId } from '@/lib/theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useStore();
  const niches = useNiches();
  const ground = useAppGround();
  const [filter, setFilter] = useState<NicheId[]>([]);
  const niche = niches[state.niche];

  // Saved posts stay here even if you hid them from feeds; archived ones are the author's to hide.
  const saved = state.posts.filter((p) => state.saves[p.id] && !p.archived);
  const savedListings = state.listings.filter((l) => state.savedListings[l.id]);
  const wanted = state.posts.filter((p) => state.wantList[p.id]).sort((a, b) => state.wantList[b.id] - state.wantList[a.id]);
  const savedNiches = NICHE_ORDER.filter((id) => saved.some((p) => p.niche === id) || savedListings.some((l) => l.niche === id));
  const shown = filter.length ? saved.filter((p) => filter.includes(p.niche)) : saved;
  const shownListings = filter.length ? savedListings.filter((l) => filter.includes(l.niche)) : savedListings;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>
      <View style={styles.head}>
        <DisplayText>Saved</DisplayText>
        <Text style={styles.sub}>Everything you’ve saved, from anywhere, in one place.</Text>
      </View>

      <View style={styles.importCard}>
        <Text style={styles.importTitle}>Bring your saves from Instagram and TikTok</Text>
        <Text style={styles.importBody}>Coming in a later build: your Instagram collections become boards, and your TikTok favorites land in an inbox to sort.</Text>
      </View>

      {wanted.length ? (
        <View style={{ marginTop: 22 }}>
          <Text style={[styles.section, { marginTop: 0 }]}>Want to make · {wanted.length}</Text>
          <Text style={styles.wantSub}>Tap “{diaryWords(state.niche).did}” when you’ve made it. It moves to your diary.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wantRow}>
            {wanted.map((p) => {
              const n = niches[p.niche];
              return (
                <View key={p.id} style={[styles.wantCard, { borderColor: n.accent }]}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${p.mediaLabel ?? p.caption}`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}>
                    <MediaPlaceholder post={p} height={110} radius={10} showLabel={false} />
                    <Text style={styles.wantTitle} numberOfLines={2}>{p.mediaLabel ?? p.caption}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/log/new', params: { postId: p.id } })} style={[styles.wantButton, { backgroundColor: n.accent }]}>
                    <Text style={styles.wantButtonText}>{diaryWords(p.niche).did}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {savedNiches.length > 1 ? (
        <View style={{ marginTop: 18 }}>
          <NicheFilter value={filter} onChange={setFilter} available={savedNiches} />
        </View>
      ) : null}

      {saved.length || (!savedListings.length && !wanted.length) ? <Text style={styles.section}>Posts · {shown.length}</Text> : null}
      {saved.length === 0 && (savedListings.length || wanted.length) ? null : saved.length === 0 ? (
        // Saved isn't a niche screen, so its empty state doesn't take the last niche's color.
        <View style={[styles.empty, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.emptyTitle, { color: ground.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyBody, { color: ground.body }]}>Tap Save on any post or shop listing and it lands here, outlined in its niche’s color. Boards to organize them are next.</Text>
          <Button label="Browse your feeds" color={ground.text} onPress={() => router.navigate('/')} />
        </View>
      ) : (
        <FeedGrid posts={shown} nicheBorders />
      )}

      {savedListings.length ? (
        <>
          <Text style={styles.section}>From the shops · {shownListings.length}</Text>
          <ListingGrid listings={shownListings} nicheBorders />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  head: { paddingHorizontal: 20, gap: 8 },
  sub: { fontSize: 15, color: colors.textMuted },
  wantSub: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 20, marginTop: 4 },
  wantRow: { gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  wantCard: { width: 150, borderWidth: 3, borderRadius: 16, padding: 6, gap: 6 },
  wantTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 6, lineHeight: 17 },
  wantButton: { minHeight: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  wantButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  importCard: { marginHorizontal: 20, marginTop: 18, padding: 18, borderRadius: 20, backgroundColor: colors.text, gap: 8 },
  importTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', lineHeight: 23 },
  importBody: { fontSize: 14, lineHeight: 20, color: '#C9CDD2' },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 26 },
  empty: { margin: 20, padding: 20, borderRadius: 20, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 15, lineHeight: 21 },
});
