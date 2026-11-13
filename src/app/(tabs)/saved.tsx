import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardCard, NewBoardCard, useCardWidth } from '@/components/boards';
import { EndNote, Eyebrow, RailTile, SectionTitle, ShopTile } from '@/components/discover-parts';
import { FeedGrid } from '@/components/feed-grid';
import { NicheFilter } from '@/components/niche-filter';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { boardPosts, savesLabel } from '@/lib/boards';
import { diaryWords } from '@/lib/diary';
import { useAppGround, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

/**
 * Saved, in the same style as Discover and Profile (founder, Nov 2026): a
 * serif masthead over a thin rule, boards as three-photo collages, "Want to
 * make", every save in a grid with quiet niche tabs, and the shops. It ends.
 */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const ground = useAppGround();
  const cardW = useCardWidth();
  const [filter, setFilter] = useState<NicheId[]>([]);

  // Saved posts stay here even if you hid them from feeds; archived ones are the author's to hide.
  const saved = state.posts.filter((p) => state.saves[p.id] && !p.archived);
  const savedListings = state.listings.filter((l) => state.savedListings[l.id]);
  const wanted = state.posts.filter((p) => state.wantList[p.id]).sort((a, b) => state.wantList[b.id] - state.wantList[a.id]);
  const boards = state.boards.filter((b) => b.ownerId === state.me?.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const savedNiches = NICHE_ORDER.filter((id) => saved.some((p) => p.niche === id));
  const shown = filter.length ? saved.filter((p) => filter.includes(p.niche)) : saved;
  const total = saved.length + savedListings.length;
  const nothing = total === 0 && wanted.length === 0 && boards.length === 0;
  const hasSample = boards.some((b) => b.sample);
  const newBoard = () => router.push('/boards/add');

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={42} color={ground.text}>Saved</DisplayText>
          {total ? <Eyebrow>{savesLabel(total)}</Eyebrow> : null}
        </View>

        {nothing ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: ground.text }]}>Nothing saved yet.</Text>
            <Text style={[styles.emptyBody, { color: ground.body }]}>
              Tap Save on any post and it lands here, outlined in its niche’s color. Then sort your saves into boards, like “Weeknight dinners” or “Film ideas”.
            </Text>
            <Button label="Explore Discover" color={ground.text} onPress={() => router.navigate('/discover')} />
          </View>
        ) : (
          <>
            <View style={styles.block}>
              <SectionTitle
                right={
                  <Pressable accessibilityRole="button" onPress={newBoard} style={styles.link}>
                    <Text style={[styles.linkText, { color: ground.text }]}>New board</Text>
                  </Pressable>
                }>
                Boards
              </SectionTitle>
              <View style={styles.grid}>
                <BoardCard name="All saves" posts={saved} count={saved.length} width={cardW} onPress={() => router.push({ pathname: '/boards/[id]', params: { id: 'all' } })} />
                {boards.map((b) => {
                  const posts = boardPosts(b, state.posts);
                  return (
                    <BoardCard
                      key={b.id}
                      name={b.name}
                      posts={posts}
                      count={posts.length}
                      isPrivate={b.visibility === 'private'}
                      width={cardW}
                      onPress={() => router.push({ pathname: '/boards/[id]', params: { id: b.id } })}
                    />
                  );
                })}
                <NewBoardCard width={cardW} onPress={newBoard} />
              </View>
            </View>

            {wanted.length ? (
              <View style={styles.block}>
                <SectionTitle>Want to make</SectionTitle>
                <Text style={[styles.sub, { color: ground.muted }]}>Tap “{diaryWords(state.niche).did}” when you’ve made it. It moves to your diary.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                  {wanted.map((p) => (
                    <View key={p.id} style={{ width: 150, gap: 8 }}>
                      <RailTile post={p} />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${diaryWords(p.niche).did}: ${p.mediaLabel ?? p.caption}`}
                        onPress={() => router.push({ pathname: '/log/new', params: { postId: p.id } })}
                        style={({ pressed }) => [styles.did, { borderColor: ground.text, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                        <Text style={[styles.didText, { color: ground.text }]}>{diaryWords(p.niche).did}</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {saved.length ? (
              <View style={styles.block}>
                <SectionTitle>All saves</SectionTitle>
                {savedNiches.length > 1 ? (
                  <View style={{ marginTop: 6 }}>
                    <NicheFilter value={filter} onChange={setFilter} available={savedNiches} />
                  </View>
                ) : null}
                <FeedGrid posts={shown} nicheBorders />
              </View>
            ) : null}

            {savedListings.length ? (
              <View style={styles.block}>
                <SectionTitle>From the shops</SectionTitle>
                <View style={styles.grid}>
                  {savedListings.map((l) => (
                    <ShopTile key={l.id} listing={l} width={cardW} />
                  ))}
                </View>
              </View>
            ) : null}

            <EndNote title="That’s everything you’ve saved." body="Boards are private unless you put one on your profile." />
          </>
        )}

        <View style={[styles.importCard, { borderColor: ground.line }]}>
          <Eyebrow>Coming soon</Eyebrow>
          <Text style={[styles.importTitle, { color: ground.text }]}>Bring your saves from Instagram and TikTok</Text>
          <Text style={[styles.importBody, { color: ground.body }]}>Share a post to Niches straight from Instagram or TikTok, or import your saved collections once. They become boards here.</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={hasSample ? actions.removeSampleBoards : actions.addSampleBoards} style={styles.demo}>
          <Text style={[styles.demoText, { color: ground.muted }]}>{hasSample ? 'Demo: remove the sample boards' : 'Demo: add sample saves and boards'}</Text>
        </Pressable>
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  masthead: { marginHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  block: { marginTop: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 12, paddingHorizontal: 20, paddingTop: 12 },
  link: { minHeight: TOUCH, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 14, lineHeight: 19, paddingHorizontal: 20, marginTop: 4 },
  rail: { gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  did: { minHeight: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  didText: { fontSize: 14, fontWeight: '700' },
  emptyWrap: { margin: 20, marginTop: 24, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 28, lineHeight: 31 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  importCard: { margin: 20, marginTop: 28, padding: 18, borderRadius: 20, borderWidth: 1, backgroundColor: '#FFFFFF', gap: 6 },
  importTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 27 },
  importBody: { fontSize: 14, lineHeight: 20 },
  demo: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  demoText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
