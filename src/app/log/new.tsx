import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarInput } from '@/components/diary';
import { Eyebrow } from '@/components/discover-parts';
import { CalendarIcon, CameraIcon, CheckIcon, CloseIcon } from '@/components/icons';
import { MonthCalendar } from '@/components/month-calendar';
import { SurfaceProvider } from '@/components/surface';
import { DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { diaryWords, type LogVisibility } from '@/lib/diary';
import { goalRule } from '@/lib/goals';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import { shortTitle } from '@/lib/format';
import { isoDay, parseDay } from '@/lib/plans';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

/**
 * "I made this": add an entry to your diary. Private unless you choose otherwise.
 * With `edit=<entry id>` it edits an entry instead (founder, Nov 17 2026). The
 * entry is its own copy: editing it never changes the post it came from, and
 * editing that post never changes the entry.
 */
export default function NewLogScreen() {
  const params = useLocalSearchParams<{ postId?: string; niche?: NicheId; goalId?: string; edit?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions, usersById } = useStore();
  const niches = useNiches();
  const appGround = useAppGround();
  const editing = params.edit ? state.logs.find((l) => l.id === params.edit && l.userId === state.me?.id) : undefined;
  const sourceId = editing ? editing.postId : params.postId;
  const source = sourceId ? state.posts.find((p) => p.id === sourceId) : undefined;
  const sourceAuthor = source ? usersById[source.authorId] : undefined;

  const [nicheId, setNicheId] = useState<NicheId>(editing?.niche ?? source?.niche ?? (params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche));
  const fromMyPost = !!source && source.authorId === state.me?.id;
  // Your own post's caption is the full text; demo posts have a short title already.
  const [title, setTitle] = useState(editing ? editing.title : source ? (fromMyPost ? shortTitle(source.caption) : source.mediaLabel ?? shortTitle(source.caption)) : '');
  const [date, setDate] = useState(editing?.date ?? isoDay(0));
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  // Logging your own post brings its photo along.
  const [photo, setPhoto] = useState<PickedPhoto | null>(
    editing
      ? editing.imageUri
        ? { uri: editing.imageUri, width: 1000, height: 1000 }
        : null
      : fromMyPost && source?.imageUri ? { uri: source.imageUri, width: 1000, height: Math.round(1000 * (source.imageAspect ?? 1)) } : null,
  );
  const [visibility, setVisibility] = useState<LogVisibility>(editing?.visibility ?? 'private');
  // Goals this entry counts toward. Personal bests need a number, so they're checked in on the goal itself.
  const [goalIds, setGoalIds] = useState<string[]>(params.goalId ? [params.goalId] : []);

  const niche = niches[nicheId];
  const words = diaryWords(nicheId);
  const goals = state.goals.filter((g) => g.userId === state.me?.id && g.niche === nicheId && !g.doneAt && g.kind !== 'best');
  const toggleGoal = (id: string) => setGoalIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const ready = !!state.me && title.trim().length > 0 && rating > 0;
  // Today and Yesterday as quick words; any other day comes from the calendar.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const otherDay = date !== isoDay(0) && date !== isoDay(-1);

  const save = () => {
    if (!ready || !state.me) return;
    if (editing) {
      actions.updateLog(editing.id, {
        niche: nicheId,
        title: title.trim(),
        date,
        rating,
        notes: notes.trim() || undefined,
        imageUri: photo?.uri,
        mediaColor: photo ? '#E3E5E1' : editing.imageUri ? niche.field : editing.mediaColor,
        visibility,
      });
      toast('Entry updated');
      router.back();
      return;
    }
      const id = actions.addLog(
      {
        userId: state.me.id,
        niche: nicheId,
        postId: source?.id,
        title: title.trim(),
        date,
        rating,
        notes: notes.trim() || undefined,
        imageUri: photo?.uri,
        mediaColor: photo ? '#E3E5E1' : source?.mediaColor ?? niche.field,
        visibility,
      },
      undefined,
      goalIds.filter((id) => goals.some((g) => g.id === id)),
    );
    toast(visibility === 'profile' ? 'Logged on your profile' : 'Logged in your private diary');
    router.replace({ pathname: '/log/[id]', params: { id } });
  };

  const ground = groundSurface(appGround);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  // "Sat, Nov 7", with the year only when it isn't this year.
  const dayName = (d: string) => parseDay(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...(d.slice(0, 4) === isoDay(0).slice(0, 4) ? {} : { year: 'numeric' }) });
  const quiet = (on: boolean, accent: string) => [styles.word, { color: on ? ground.text : ground.muted, fontWeight: on ? ('700' as const) : ('500' as const), borderBottomColor: on ? accent : 'transparent' }];

  return (
    <SurfaceProvider value={ground}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ground.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={close} style={styles.close}>
          <CloseIcon color={ground.text} />
        </Pressable>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={38} color={ground.text}>{editing ? 'Edit entry' : 'Diary entry'}</DisplayText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={save}
            style={({ pressed }) => [styles.savePill, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
            <Text style={[styles.saveText, { color: ground.ground }]}>Save</Text>
          </Pressable>
        </View>

        {/* Photo, and where it came from */}
        <View style={styles.photoRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={photo ? 'Change photo' : 'Add a photo'} onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }} style={[styles.thumb, { backgroundColor: photo ? '#E3E5E1' : ground.line }]}>
            {photo ? <Image source={{ uri: photo.uri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <CameraIcon size={22} color={ground.text} />}
          </Pressable>
          <View style={{ flex: 1, gap: 3 }}>
            {source ? <Eyebrow>{editing ? 'Changes stay in your diary' : `From ${sourceAuthor?.id === state.me?.id ? 'your post' : `${sourceAuthor?.username}’s post`}`}</Eyebrow> : null}
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable accessibilityRole="button" onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }} style={styles.smallLink}>
                <Text style={[styles.smallLinkText, { color: ground.text }]}>{photo ? 'Change photo' : 'Add a photo'}</Text>
              </Pressable>
              {photo ? (
                <Pressable accessibilityRole="button" onPress={() => setPhoto(null)} style={styles.smallLink}>
                  <Text style={[styles.smallLinkText, { color: ground.muted }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <TextInput
          accessibilityLabel="Title"
          value={title}
          onChangeText={setTitle}
          // One line to start, growing with the text, so the stars sit right under it.
          // (Phones grow on their own; the web needs rows=1 and field-sizing.)
          {...(Platform.OS === 'web' ? { rows: 1 } : null)}
          maxLength={60}
          multiline
          placeholder={`What did you ${nicheId === 'photography' ? 'shoot' : nicheId === 'gym' ? 'do' : 'make'}?`}
          placeholderTextColor={ground.muted}
          selectionColor={ground.text}
          style={[styles.titleInput, { color: ground.text, fontFamily: title ? fonts.display : fonts.displayItalic }, Platform.OS === 'web' ? ({ outlineStyle: 'none', fieldSizing: 'content' } as object) : null]}
        />

        <View style={{ marginLeft: -4, paddingBottom: 10 }}>
          <StarInput value={rating} onChange={setRating} color={niche.accent} size={42} />
        </View>

        <View style={[styles.rows, { borderTopColor: ground.line }]}>
          {source ? null : (
            <View style={[styles.block, { borderBottomColor: ground.line }]}>
              <Eyebrow>Niche</Eyebrow>
              <View accessibilityRole="radiogroup" style={styles.words}>
                {NICHE_ORDER.map((id) => (
                  <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: id === nicheId }} onPress={() => setNicheId(id)} style={styles.wordHit}>
                    <Text style={quiet(id === nicheId, niches[id].accent)}>{niches[id].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.block, { borderBottomColor: ground.line }]}>
            <Eyebrow>When</Eyebrow>
            <View accessibilityRole="radiogroup" style={styles.words}>
              {[isoDay(0), isoDay(-1)].map((d, i) => (
                <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: d === date }} onPress={() => (setDate(d), setCalendarOpen(false))} style={styles.wordHit}>
                  <Text style={quiet(d === date, ground.text)}>{i === 0 ? 'Today' : 'Yesterday'}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={otherDay ? `${dayName(date)}. Pick another day` : 'Pick a day on the calendar'}
                accessibilityState={{ expanded: calendarOpen }}
                onPress={() => setCalendarOpen((o) => !o)}
                style={[styles.wordHit, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <CalendarIcon size={16} color={otherDay || calendarOpen ? ground.text : ground.muted} />
                <Text style={quiet(otherDay, ground.text)}>{otherDay ? dayName(date) : 'Another day'}</Text>
              </Pressable>
            </View>
            {calendarOpen ? (
              <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(120)} style={[styles.calCard, { shadowColor: ground.text }]}>
                <MonthCalendar
                  value={date}
                  max={isoDay(0)}
                  accent={niche.accent}
                  onChange={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                />
              </Animated.View>
            ) : null}
          </View>

          <View style={[styles.block, { borderBottomColor: ground.line }]}>
            <Eyebrow>Notes for next time</Eyebrow>
            <TextInput
              accessibilityLabel="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              selectionColor={ground.text}
              style={[styles.notesInput, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            />
          </View>

          {/* Check-ins were counted when it was logged, so editing doesn't count them again. */}
          {goals.length && !editing ? (
            <View style={[styles.block, { borderBottomColor: ground.line }]}>
              <Eyebrow>Counts toward</Eyebrow>
              {goals.map((g) => {
                const on = goalIds.includes(g.id);
                return (
                  <Pressable key={g.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggleGoal(g.id)} style={styles.goal}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.goalTitle, { color: ground.text }]}>{g.title}</Text>
                      <Text style={[styles.goalSub, { color: ground.muted }]}>{goalRule(g)}</Text>
                    </View>
                    <View style={[styles.check, on ? { backgroundColor: ground.text, borderColor: ground.text } : { borderColor: ground.muted }]}>{on ? <CheckIcon size={14} strokeWidth={2.8} /> : null}</View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.block, { borderBottomColor: ground.line }]}>
            <Eyebrow>Who can see it</Eyebrow>
            <View accessibilityRole="radiogroup" style={styles.words}>
              {(['private', 'profile'] as LogVisibility[]).map((v) => (
                <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: v === visibility }} onPress={() => setVisibility(v)} style={styles.wordHit}>
                  <Text style={quiet(v === visibility, ground.text)}>{v === 'private' ? 'Private' : 'Public'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.goalSub, { color: ground.muted }]}>{visibility === 'private' ? 'Only you can see it.' : 'Shows in the Diary tab on your profile.'}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  close: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1 },
  savePill: { minHeight: 40, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16 },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  smallLink: { minHeight: 32, justifyContent: 'center' },
  smallLinkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  titleInput: { fontSize: 36, lineHeight: 40, paddingTop: 14, paddingBottom: 0, minHeight: 40 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth * 2, marginTop: 6 },
  block: { paddingVertical: 14, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  words: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 },
  wordHit: { minHeight: 40, justifyContent: 'center' },
  word: { fontSize: 15, paddingBottom: 5, borderBottomWidth: 2.5 },
  notesInput: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 27, minHeight: 60, paddingVertical: 2, textAlignVertical: 'top' },
  // The calendar sits on white so it stands out from the cream (founder, Nov 19 2026).
  calCard: { marginTop: 4, paddingHorizontal: 10, paddingBottom: 8, borderRadius: 20, backgroundColor: '#FFFFFF', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  goalTitle: { fontSize: 15, fontWeight: '700' },
  goalSub: { fontSize: 13, lineHeight: 18 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
