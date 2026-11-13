import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink, EndNote, Eyebrow } from '@/components/discover-parts';
import { FeedGrid } from '@/components/feed-grid';
import { MoreIcon } from '@/components/icons';
import { NicheFilter } from '@/components/niche-filter';
import { Button, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { boardPosts, savesLabel } from '@/lib/boards';
import { useAppGround, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

/**
 * One board, or "all" for every save. Boards mix niches, so the page sits on
 * the app background and each post keeps its niche-colored border.
 */
export default function BoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const ground = useAppGround();
  const [filter, setFilter] = useState<NicheId[]>([]);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/saved'));

  const all = id === 'all';
  const board = all ? undefined : state.boards.find((b) => b.id === id);
  const isMine = !!board && board.ownerId === state.me?.id;
  // Someone else's private board can't be opened.
  const hidden = !!board && !isMine && board.visibility !== 'profile';
  const posts = all ? state.posts.filter((p) => state.saves[p.id] && !p.archived) : board && !hidden ? boardPosts(board, state.posts) : [];
  const niches = NICHE_ORDER.filter((n) => posts.some((p) => p.niche === n));
  const shown = filter.length ? posts.filter((p) => filter.includes(p.niche)) : posts;
  const name = all ? 'All saves' : board?.name ?? '';

  if (!all && (!board || hidden)) {
    return (
      <SurfaceProvider value={groundSurface(ground)}>
        <View style={[styles.screen, { backgroundColor: ground.ground, paddingTop: insets.top + 4, paddingHorizontal: 14 }]}>
          <BackLink label="Back" onPress={goBack} />
          <Text style={{ fontSize: 17, color: ground.text, padding: 6, marginTop: 20 }}>This board isn’t available.</Text>
        </View>
      </SurfaceProvider>
    );
  }

  const eyebrow = all
    ? savesLabel(posts.length)
    : isMine
      ? `${board!.visibility === 'private' ? 'Private board' : 'On your profile'} · ${savesLabel(posts.length)}`
      : `Board by ${usersById[board!.ownerId]?.username ?? 'someone'} · ${savesLabel(posts.length)}`;

  const saveName = () => {
    if (board && draft.trim()) actions.renameBoard(board.id, draft);
    setRenaming(false);
  };

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <ScrollView style={[styles.screen, { backgroundColor: ground.ground }]} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <BackLink label={isMine || all ? 'Saved' : 'Back'} onPress={goBack} />
          {isMine ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Board options" onPress={() => setMenu(true)} style={styles.more}>
              <MoreIcon size={22} color={ground.text} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.head, { borderBottomColor: ground.text }]}>
          <Eyebrow>{eyebrow}</Eyebrow>
          {renaming ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              accessibilityLabel="Board name"
              value={draft}
              onChangeText={setDraft}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={saveName}
              selectionColor={ground.text}
              style={[styles.renameInput, { color: ground.text, borderBottomColor: ground.muted }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            />
            <Pressable accessibilityRole="button" onPress={saveName} style={[styles.saveName, { backgroundColor: ground.text }]}>
              <Text style={{ color: ground.ground, fontSize: 14, fontWeight: '700' }}>Save</Text>
            </Pressable>
            </View>
          ) : (
            <DisplayText size={44} color={ground.text}>{name}</DisplayText>
          )}
        </View>

        {niches.length > 1 ? (
          <View style={{ marginTop: 10 }}>
            <NicheFilter value={filter} onChange={setFilter} available={niches} />
          </View>
        ) : null}

        {shown.length ? (
          <View style={{ marginTop: 6 }}>
            <FeedGrid posts={shown} nicheBorders />
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: ground.text }]}>Nothing here yet.</Text>
            <Text style={[styles.emptyBody, { color: ground.body }]}>
              {all ? 'Tap Save on any post and it lands here.' : 'Tap Save on any post, then “Add to board”. Or use “Save to a board” in a post’s ⋯ menu.'}
            </Text>
            <Button label="Explore Discover" color={ground.text} onPress={() => router.navigate('/discover')} />
          </View>
        )}

        {shown.length ? <EndNote title={all ? 'That’s everything you’ve saved.' : `That’s everything on ${name}.`} /> : null}
      </ScrollView>

      {board && isMine ? (
        <Sheet
          visible={menu}
          onClose={() => {
            setMenu(false);
            setConfirmDelete(false);
          }}
          title={confirmDelete ? `Delete “${board.name}”?` : undefined}
          items={
            confirmDelete
              ? [
                  {
                    label: 'Delete board',
                    detail: 'The posts stay in your saves.',
                    destructive: true,
                    onPress: () => {
                      setMenu(false);
                      actions.deleteBoard(board.id);
                      toast('Board deleted. Your saves are still there.');
                      goBack();
                    },
                  },
                ]
              : [
                  {
                    label: 'Rename',
                    onPress: () => {
                      setMenu(false);
                      setDraft(board.name);
                      setRenaming(true);
                    },
                  },
                  board.visibility === 'private'
                    ? { label: 'Show on my profile', detail: 'Anyone can see this board on your profile.', onPress: () => (setMenu(false), actions.setBoardVisibility(board.id, 'profile'), toast('Now on your profile')) }
                    : { label: 'Make private', detail: 'Only you will see this board.', onPress: () => (setMenu(false), actions.setBoardVisibility(board.id, 'private'), toast('Board is private')) },
                  { label: 'Delete board', destructive: true, onPress: () => setConfirmDelete(true) },
                ]
          }
        />
      ) : null}
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  more: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  head: { marginHorizontal: 20, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 1, gap: 4 },
  saveName: { minHeight: 38, paddingHorizontal: 16, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  renameInput: { flex: 1, minWidth: 0, fontFamily: fonts.display, fontSize: 40, paddingVertical: 2, borderBottomWidth: 1 },
  empty: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 26 },
  emptyBody: { fontSize: 15, lineHeight: 21 },
});
