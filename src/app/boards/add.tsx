import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collage } from '@/components/boards';
import { Eyebrow } from '@/components/discover-parts';
import { tileTitle } from '@/components/feed-grid';
import { CheckIcon, LockIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { boardPosts, savesLabel } from '@/lib/boards';
import { postPhoto } from '@/lib/demo-photos';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { BODY_FONTS, groundSurface, TOUCH } from '@/lib/theme';

/**
 * "Add to board": opened from the Saved toast or a post's ⋯ menu with a
 * postId, or from Saved's "New board" without one. Tap a board to put the
 * post on it or take it off; or start a new board (private until you share it).
 */
export default function AddToBoardScreen() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = useAppGround();
  const post = postId ? state.posts.find((p) => p.id === postId) : undefined;
  const mine = state.boards.filter((b) => b.ownerId === state.me?.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const [creating, setCreating] = useState(!postId || mine.length === 0);
  const [name, setName] = useState('');
  const close = () => (router.canGoBack() ? router.back() : router.replace('/saved'));

  const create = () => {
    if (!state.me || !name.trim()) return;
    const id = actions.createBoard(state.me.id, name, 'private', post?.id);
    setName('');
    setCreating(false);
    // Without a post, a new board opens right away so you can see it.
    if (!post) router.replace({ pathname: '/boards/[id]', params: { id } });
  };

  const photo = post ? postPhoto(post) : undefined;

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ground.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8, borderBottomColor: ground.line }]}>
          <DisplayText size={30} color={ground.text}>{post ? 'Save to a board' : 'New board'}</DisplayText>
          <Pressable accessibilityRole="button" onPress={close} style={styles.done}>
            <Text style={[styles.doneText, { color: ground.text }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 18 }} keyboardShouldPersistTaps="handled">
          {post ? (
            <View style={styles.postRow}>
              <View style={[styles.postThumb, { borderColor: niches[post.niche].accent, backgroundColor: post.mediaColor ?? niches[post.niche].field }]}>
                {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.postTitle, { color: ground.text }]} numberOfLines={2}>{tileTitle(post)}</Text>
                <Text style={[styles.postSub, { color: ground.muted }]}>{state.saves[post.id] ? 'In your saves' : 'Not saved yet'}</Text>
              </View>
            </View>
          ) : null}

          {creating ? (
            <View style={styles.form}>
              <Eyebrow>Name your board</Eyebrow>
              <TextInput
                accessibilityLabel="Board name"
                value={name}
                onChangeText={setName}
                placeholder="Weeknight dinners, Film ideas…"
                placeholderTextColor={ground.muted}
                autoFocus
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={create}
                selectionColor={ground.text}
                style={[styles.input, { borderColor: ground.line, color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
              />
              <Text style={[styles.note, { color: ground.muted }]}>Boards are private. You can put one on your profile later from the board.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label={post ? 'Create and save' : 'Create board'} color={ground.text} disabled={!name.trim()} onPress={create} style={{ flex: 1 }} />
                {post && mine.length ? <Button label="Cancel" tone="outline" onPress={() => setCreating(false)} style={{ flex: 1 }} /> : null}
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={[styles.row, styles.newRow, { borderColor: ground.muted }]}>
              <Text style={[styles.newText, { color: ground.text }]}>+  New board</Text>
            </Pressable>
          )}

          {post && mine.length ? (
            <View>
              <Eyebrow style={{ marginBottom: 6 }}>Your boards</Eyebrow>
              {mine.map((b, i) => {
                const on = b.postIds.includes(post.id);
                return (
                  <Pressable
                    key={b.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${b.name}, ${savesLabel(b.postIds.length)}`}
                    onPress={() => actions.toggleOnBoard(b.id, post.id)}
                    style={[styles.row, { borderTopColor: ground.line }, i === mine.length - 1 ? { borderBottomWidth: 1, borderBottomColor: ground.line } : null]}>
                    <View style={{ width: 64 }}>
                      <Collage posts={boardPosts(b, state.posts)} height={52} radius={10} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.boardName, { color: ground.text }]} numberOfLines={1}>{b.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {b.visibility === 'private' ? <LockIcon size={11} color={ground.muted} /> : null}
                        <Text style={[styles.postSub, { color: ground.muted }]}>{savesLabel(b.postIds.length)}</Text>
                      </View>
                    </View>
                    <View style={[styles.check, on ? { backgroundColor: ground.text, borderColor: ground.text } : { borderColor: ground.muted }]}>
                      {on ? <CheckIcon size={16} color={ground.ground} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  done: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: 12 },
  doneText: { fontSize: 16, fontWeight: '700' },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postThumb: { width: 56, height: 56, borderRadius: 12, borderWidth: 2.5, overflow: 'hidden' },
  postTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  postSub: { fontSize: 13 },
  form: { gap: 10 },
  input: { minHeight: TOUCH + 6, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 17, fontFamily: BODY_FONTS['500'], backgroundColor: '#FFFFFF' },
  note: { fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, borderTopWidth: 1 },
  newRow: { borderTopWidth: 0, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', minHeight: 54 },
  newText: { fontSize: 16, fontWeight: '700' },
  boardName: { fontSize: 16, fontWeight: '700' },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
