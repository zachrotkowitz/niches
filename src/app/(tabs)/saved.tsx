import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedGrid } from '@/components/feed-grid';
import { NicheFilter } from '@/components/niche-filter';
import { Button, DisplayText } from '@/components/primitives';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, type NicheId } from '@/lib/theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useStore();
  const niches = useNiches();
  const [filter, setFilter] = useState<NicheId[]>([]);
  const niche = niches[state.niche];

  // Saved posts stay here even if you hid them from feeds; archived ones are the author's to hide.
  const saved = state.posts.filter((p) => state.saves[p.id] && !p.archived);
  const savedNiches = NICHE_ORDER.filter((id) => saved.some((p) => p.niche === id));
  const shown = filter.length ? saved.filter((p) => filter.includes(p.niche)) : saved;

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

      <Text style={styles.section}>All saves · {saved.length}</Text>
      {saved.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: niche.field }]}>
          <Text style={[styles.emptyTitle, { color: niche.ink }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyBody, { color: niche.inkSoft }]}>Tap Save on any post and it lands here, outlined in its niche’s color. Boards to organize them are next.</Text>
          <Button label={`Browse ${niche.label}`} color={niche.accent} onPress={() => router.navigate('/')} />
        </View>
      ) : (
        <>
          {savedNiches.length > 1 ? (
            <View style={{ marginTop: 10 }}>
              <NicheFilter value={filter} onChange={setFilter} available={savedNiches} />
            </View>
          ) : null}
          <FeedGrid posts={shown} nicheBorders />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  head: { paddingHorizontal: 20, gap: 8 },
  sub: { fontSize: 15, color: colors.textMuted },
  importCard: { marginHorizontal: 20, marginTop: 18, padding: 18, borderRadius: 20, backgroundColor: colors.text, gap: 8 },
  importTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', lineHeight: 23 },
  importBody: { fontSize: 14, lineHeight: 20, color: '#C9CDD2' },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 26 },
  empty: { margin: 20, padding: 20, borderRadius: 20, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 15, lineHeight: 21 },
});
