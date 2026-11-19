import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarInput } from '@/components/diary';
import { Eyebrow } from '@/components/discover-parts';
import { CheckIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { diaryWords, type LogVisibility } from '@/lib/diary';
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
  const [visibility, setVisibility] = useState<LogVisibility>('private');
  const { height } = useWindowDimensions();

  // Swipe the sheet down to close it (founder, Nov 17 2026). It follows your
  // finger; let go past about a third of the way, or flick, and it slides away.
  const drag = useSharedValue(0);
  const sheetH = useSharedValue(500);
  const pan = usePanGesture({
    activeOffsetY: [-1000, 8],
    failOffsetX: [-20, 20],
    onUpdate: (e) => {
      'worklet';
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (drag.get() > sheetH.get() * 0.3 || e.velocityY > 900) {
        drag.set(withTiming(height, { duration: 200, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.System }, () => scheduleOnRN(onClose)));
      } else {
        drag.set(withSpring(0, { duration: 300, dampingRatio: 1, reduceMotion: ReduceMotion.System }));
      }
    },
  });
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drag.get() }] }));

  // Start fresh each time it opens.
  useEffect(() => {
    if (!visible || !post) return;
    setTitle(startTitle);
    setRating(0);
    setNotes(null);
    setPhoto(mine && post.imageUri ? { uri: post.imageUri, width: 1000, height: Math.round(1000 * (post.imageAspect ?? 1)) } : null);
    setGoalIds([]);
    setVisibility('private');
    drag.set(0);
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
        visibility,
      },
      undefined,
      goalIds,
    );
    onClose();
    toast(`Added to your ${words.diary}`, { label: 'Open', onPress: () => router.push({ pathname: '/log/[id]', params: { id } }) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SurfaceProvider value={ground}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Nothing behind is dimmed (founder); tap above the sheet to close. */}
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} />
          <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            onLayout={(e) => sheetH.set(e.nativeEvent.layout.height)}
            style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8, shadowColor: niche.ink }, sheetStyle]}>
            <View style={{ gap: 8 }}>
                <View style={styles.grabber} />
                <View style={styles.head}>
                  <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>Add to diary</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Close without saving" onPress={onClose} hitSlop={6} style={styles.close}>
                    <CloseIcon size={20} color={ground.text} />
                  </Pressable>
                </View>
            </View>

            <View style={styles.dish}>
              <View style={[styles.thumb, { backgroundColor: post.mediaColor ?? niche.field }]}>
                {thumb ? <Image source={thumb} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
              <TextInput
                accessibilityLabel="Name"
                value={title}
                onChangeText={setTitle}
                {...(Platform.OS === 'web' ? { rows: 1 } : null)}
                maxLength={60}
                multiline
                selectionColor={ground.text}
                style={[styles.title, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none', fieldSizing: 'content' } as object) : null]}
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
                <View style={[styles.row, { borderBottomColor: ground.line, paddingVertical: 10, flexDirection: 'column', alignItems: 'stretch', gap: 2 }]}>
                  <Eyebrow>Notes</Eyebrow>
                  <View style={styles.writeCard}>
                  <TextInput
                    accessibilityLabel="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    autoFocus
                    multiline
                    maxLength={500}
                    selectionColor={ground.text}
                    style={[styles.notes, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
                  />
                  </View>
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
              {/* Private or public, right here (founder, Nov 17 2026). Public shows in your profile's Diary tab. */}
              <View accessibilityRole="radiogroup" accessibilityLabel="Who can see this entry" style={styles.toggle}>
                {(['private', 'profile'] as LogVisibility[]).map((v) => {
                  const on = visibility === v;
                  return (
                    <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.toggleItem, on && { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.toggleText, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500' }]}>{v === 'private' ? 'Private' : 'Public'}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flex: 1 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={save}
                style={({ pressed }) => [styles.save, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
                <Text style={[styles.saveText, { color: ground.ground }]}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </SurfaceProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 12, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,26,20,0.18)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,26,20,0.07)', alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(31,26,20,0.07)' },
  toggleItem: { minHeight: 36, paddingHorizontal: 14, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14 },
  heading: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  small: { fontSize: 13 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF' },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  // White means "write here" (founder, Nov 19 2026).
  writeCard: { marginTop: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#FFFFFF' },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 22, lineHeight: 26, paddingVertical: 2 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  rowText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  notes: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 25, minHeight: 50, textAlignVertical: 'top' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  save: { minHeight: 48, paddingHorizontal: 28, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
});
