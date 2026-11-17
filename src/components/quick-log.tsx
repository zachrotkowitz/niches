import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarInput } from '@/components/diary';
import { CheckIcon, PlusIcon } from '@/components/icons';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { diaryWords } from '@/lib/diary';
import { postPhoto } from '@/lib/demo-photos';
import { shortTitle } from '@/lib/format';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import { isoDay } from '@/lib/plans';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';
import type { Post } from '@/lib/types';

/**
 * Option C (founder, Nov 17 2026): tapping "I made this" on a post slides up a
 * small cream sheet over it. Stars and Save are all you need; notes, your own
 * photo and a goal are optional rows. Saved privately for today, changeable
 * later on the entry. The full page (`/log/new`) is for entries that don't
 * start from a post, and for editing.
 */
export function QuickLog({ post, visible, onClose }: { post: Post | undefined; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const mine = !!post && post.authorId === state.me?.id;
  const startTitle = post ? (mine ? shortTitle(post.caption) : post.mediaLabel ?? shortTitle(post.caption)) : '';

  const [title, setTitle] = useState(startTitle);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [goalIds, setGoalIds] = useState<string[]>([]);

  // Start fresh each time it opens.
  useEffect(() => {
    if (!visible || !post) return;
    setTitle(startTitle);
    setRating(0);
    setNotes(null);
    setPhoto(mine && post.imageUri ? { uri: post.imageUri, width: 1000, height: Math.round(1000 * (post.imageAspect ?? 1)) } : null);
    setGoalIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, post?.id]);

  if (!post) return null;
  const niche = niches[post.niche];
  const words = diaryWords(post.niche);
  const goals = state.goals.filter((g) => g.userId === state.me?.id && g.niche === post.niche && !g.doneAt && g.kind !== 'best');
  const ready = !!state.me && title.trim().length > 0 && rating > 0;
  const thumb = photo ? { uri: photo.uri } : postPhoto(post);

  const save = () => {
    if (!ready || !state.me) return;
    const id = actions.addLog(
      {
        userId: state.me.id,
        niche: post.niche,
        postId: post.id,
        title: title.trim(),
        date: isoDay(0),
        rating,
        notes: notes?.trim() || undefined,
        imageUri: photo?.uri,
        mediaColor: photo ? '#E3E5E1' : post.mediaColor ?? niche.field,
        visibility: 'private',
      },
      undefined,
      goalIds,
    );
    onClose();
    toast(`Added to your ${words.diary}`, { label: 'Open', onPress: () => router.push({ pathname: '/log/[id]', params: { id } }) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SurfaceProvider value={ground}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Nothing behind is dimmed (founder); tap above the sheet to close. */}
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} />
          <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8, shadowColor: niche.ink }]}>
            <View style={styles.grabber} />
            <View style={styles.head}>
              <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>Add to diary</Text>
              <Text style={[styles.small, { color: ground.muted }]}>Today</Text>
            </View>

            <View style={styles.dish}>
              <View style={[styles.thumb, { backgroundColor: post.mediaColor ?? niche.field }]}>
                {thumb ? <Image source={thumb} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
              <TextInput
                accessibilityLabel="Name"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
                multiline
                selectionColor={ground.text}
                style={[styles.title, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
              />
            </View>

            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <StarInput value={rating} onChange={setRating} color={niche.accent} size={44} />
            </View>

            <View style={[styles.rows, { borderTopColor: ground.line }]}>
              {notes === null ? (
                <Pressable accessibilityRole="button" onPress={() => setNotes('')} style={[styles.row, { borderBottomColor: ground.line }]}>
                  <PlusIcon size={16} color={ground.muted} strokeWidth={2.4} />
                  <Text style={[styles.rowText, { color: ground.text }]}>Add notes for next time</Text>
                </Pressable>
              ) : (
                <View style={[styles.row, { borderBottomColor: ground.line, paddingVertical: 8 }]}>
                  <TextInput
                    accessibilityLabel="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    autoFocus
                    multiline
                    maxLength={500}
                    placeholder={post.niche === 'cooking' ? 'Halve the soy, double the garlic…' : 'What would you change?'}
                    placeholderTextColor={ground.muted}
                    selectionColor={ground.text}
                    style={[styles.notes, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
                  />
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  const p = await pickPhoto();
                  if (p) setPhoto(p);
                }}
                style={[styles.row, { borderBottomColor: ground.line }]}>
                {photo ? <CheckIcon size={16} color={ground.text} strokeWidth={2.6} /> : <PlusIcon size={16} color={ground.muted} strokeWidth={2.4} />}
                <Text style={[styles.rowText, { color: ground.text }]}>{photo ? (mine ? 'Using your post’s photo · Change' : 'Your photo added · Change') : 'Add your photo'}</Text>
              </Pressable>
              {goals.map((g) => {
                const on = goalIds.includes(g.id);
                return (
                  <Pressable
                    key={g.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setGoalIds((ids) => (on ? ids.filter((x) => x !== g.id) : [...ids, g.id]))}
                    style={[styles.row, { borderBottomColor: ground.line }]}>
                    {on ? <CheckIcon size={16} color={ground.text} strokeWidth={2.6} /> : <PlusIcon size={16} color={ground.muted} strokeWidth={2.4} />}
                    <Text style={[styles.rowText, { color: ground.text }]}>Counts toward {g.title}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.foot}>
              <Text style={[styles.small, { color: ground.muted, flex: 1 }]}>Just you · change it later</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={save}
                style={({ pressed }) => [styles.save, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
                <Text style={[styles.saveText, { color: ground.ground }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SurfaceProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 12, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,26,20,0.18)' },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  small: { fontSize: 13 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 22, lineHeight: 26, paddingVertical: 2 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  rowText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  notes: { flex: 1, fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 25, minHeight: 50, textAlignVertical: 'top' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  save: { minHeight: 48, paddingHorizontal: 28, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
});
