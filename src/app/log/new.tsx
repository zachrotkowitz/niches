import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarInput } from '@/components/diary';
import { CameraIcon, CheckIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { diaryWords, type LogVisibility } from '@/lib/diary';
import { goalRule } from '@/lib/goals';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import { isoDay } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

/** "I made this": add an entry to your diary. Private unless you choose otherwise. */
export default function NewLogScreen() {
  const params = useLocalSearchParams<{ postId?: string; niche?: NicheId; goalId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions, usersById } = useStore();
  const niches = useNiches();
  const source = params.postId ? state.posts.find((p) => p.id === params.postId) : undefined;
  const sourceAuthor = source ? usersById[source.authorId] : undefined;

  const [nicheId, setNicheId] = useState<NicheId>(source?.niche ?? (params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche));
  const [title, setTitle] = useState(source ? (source.mediaLabel ?? source.caption.split(/[.!?\n]/)[0]).slice(0, 60) : '');
  const [date, setDate] = useState(isoDay(0));
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [visibility, setVisibility] = useState<LogVisibility>('private');
  const [share, setShare] = useState(false);
  // Goals this entry counts toward. Personal bests need a number, so they're checked in on the goal itself.
  const [goalIds, setGoalIds] = useState<string[]>(params.goalId ? [params.goalId] : []);

  const niche = niches[nicheId];
  const words = diaryWords(nicheId);
  const goals = state.goals.filter((g) => g.userId === state.me?.id && g.niche === nicheId && !g.doneAt && g.kind !== 'best');
  const toggleGoal = (id: string) => setGoalIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const canShare = niche.open;
  const ready = !!state.me && title.trim().length > 0 && rating > 0;
  const days = Array.from({ length: 14 }, (_, i) => isoDay(-i));

  const save = () => {
    if (!ready || !state.me) return;
    const credit = sourceAuthor && sourceAuthor.id !== state.me.id ? ` (recipe from ${sourceAuthor.username})` : '';
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
      share && canShare ? { caption: `${words.did}: ${title.trim()}${credit}. ${'★'.repeat(rating)}${notes.trim() ? `\n${notes.trim()}` : ''}`, imageAspect: photo ? photo.height / photo.width : undefined } : undefined,
      goalIds.filter((id) => goals.some((g) => g.id === id)),
    );
    toast(share && canShare ? 'Logged and shared' : visibility === 'profile' ? 'Logged on your profile' : 'Logged in your private diary');
    router.replace({ pathname: '/log/[id]', params: { id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.navButton}>
          <Text style={[styles.navText, { color: niche.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>{words.did}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={save} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: niche.accent, fontWeight: '700', opacity: ready ? 1 : 0.4 }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {source ? (
          <Text style={[styles.from, { backgroundColor: niche.field, color: niche.ink }]}>From {sourceAuthor?.id === state.me?.id ? 'your post' : `${sourceAuthor?.username}’s post`}</Text>
        ) : (
          <Field label="Niche">
            <View style={styles.wrap}>
              {NICHE_ORDER.map((id) => {
                const on = id === nicheId;
                return (
                  <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setNicheId(id)} style={[styles.chip, { borderColor: niches[id].accent }, on ? { backgroundColor: niches[id].accent } : null]}>
                    <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{niches[id].label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        )}

        <Field label={`What did you ${nicheId === 'photography' ? 'shoot' : nicheId === 'gym' ? 'do' : 'make'}?`}>
          <TextInput accessibilityLabel="Title" value={title} onChangeText={setTitle} maxLength={60} placeholder={nicheId === 'cooking' ? 'e.g. Weeknight carbonara' : 'Give it a name'} placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
        </Field>

        <Field label="How did it turn out?">
          <StarInput value={rating} onChange={setRating} color={niche.accent} />
        </Field>

        <Field label="When">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => {
              const on = d === date;
              return (
                <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDate(d)} style={[styles.day, on ? { backgroundColor: niche.accent } : null]}>
                  <Text style={[styles.dayText, on ? { color: '#FFFFFF' } : null]}>
                    {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Field>

        {photo ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Change photo" onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }} style={styles.photo}>
            <Image source={{ uri: photo.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }} style={styles.picker}>
            <CameraIcon color={colors.textBody} />
            <Text style={styles.pickerText}>Add a photo of yours (optional)</Text>
          </Pressable>
        )}

        <Field label="Notes for next time (optional)">
          <TextInput accessibilityLabel="Notes" value={notes} onChangeText={setNotes} multiline maxLength={500} placeholder={nicheId === 'cooking' ? 'e.g. Halve the soy, double the garlic' : 'What would you change?'} placeholderTextColor="#6B7178" style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]} selectionColor={niche.accent} />
        </Field>

        <Field label="Who can see this entry">
          <View style={{ gap: 8 }}>
            {(['private', 'profile'] as LogVisibility[]).map((v) => {
              const on = v === visibility;
              return (
                <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.option, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                  <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.optionTitle}>{v === 'private' ? 'Just me' : 'On my profile'}</Text>
                    <Text style={styles.optionSub}>{v === 'private' ? 'Your private diary. Nobody else sees it.' : 'Shows in the Diary tab on your profile.'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {goals.length ? (
          <Field label="Counts toward">
            <View style={{ gap: 8 }}>
              {goals.map((g) => {
                const on = goalIds.includes(g.id);
                return (
                  <Pressable key={g.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggleGoal(g.id)} style={styles.check}>
                    <View style={[styles.box, on ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>{on ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.optionTitle}>{g.title}</Text>
                      <Text style={styles.optionSub}>{goalRule(g)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        ) : null}

        {canShare ? (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: share }} onPress={() => setShare(!share)} style={styles.check}>
            <View style={[styles.box, share ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>{share ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.optionTitle}>Also share as a post in {niche.label}</Text>
              <Text style={styles.optionSub}>Posts your photo, rating and notes to the {niche.label} feed{source && sourceAuthor?.id !== state.me?.id ? `, crediting ${sourceAuthor?.username}` : ''}.</Text>
            </View>
          </Pressable>
        ) : null}

        <Button label={rating ? 'Save to diary' : 'Rate it to save'} color={niche.accent} disabled={!ready} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  from: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  day: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.textBody },
  photo: { height: 220, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E3E5E1' },
  picker: { minHeight: 64, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9BFB8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pickerText: { fontSize: 15, fontWeight: '600', color: colors.textBody },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionSub: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 4 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
