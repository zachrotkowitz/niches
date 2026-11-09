import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon, CameraIcon, CheckIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { goalRule, weekNumber } from '@/lib/goals';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import type { PostKind } from '@/lib/types';

type Kind = 'post' | 'progress' | 'question';

// Shown behind a photo while it loads.
const LOADING_TINT = '#E3E5E1';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const [kind, setKind] = useState<Kind>('post');
  const [caption, setCaption] = useState('');
  const [goal, setGoal] = useState('');
  // The goal a progress post belongs to; null means "just name it" (free text).
  const [goalId, setGoalId] = useState<string | null>(null);
  // Opening from a goal's "Progress post" button preselects it.
  useEffect(() => {
    if (params.goalId) {
      setKind('progress');
      setGoalId(params.goalId);
    }
  }, [params.goalId]);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [picking, setPicking] = useState(false);
  const choosePhoto = async () => {
    setPicking(true);
    try {
      const picked = await pickPhoto();
      if (picked) setPhoto(picked);
    } finally {
      setPicking(false);
    }
  };
  const [nicheId] = useState<NicheId>('cooking');
  const [postedId, setPostedId] = useState<string | null>(null);
  const [membersOnly, setMembersOnly] = useState(false);

  const niche = NICHES[nicheId];
  const needsPhoto = kind !== 'question';
  const myGoals = state.goals.filter((g) => g.userId === state.me?.id && g.niche === nicheId && !g.doneAt);
  const pickedGoal = goalId ? myGoals.find((g) => g.id === goalId) : undefined;
  const ready = caption.trim().length > 0 && (kind !== 'progress' || !!pickedGoal || goal.trim().length > 0);

  const share = () => {
    if (!ready || !state.me) return;
    const postKind: PostKind = kind === 'question' || !photo ? 'text' : 'photo';
    const id = actions.createPost({
      authorId: state.me.id,
      niche: nicheId,
      kind: postKind,
      caption: caption.trim(),
      mediaColor: postKind === 'photo' ? LOADING_TINT : undefined,
      imageUri: postKind === 'photo' ? photo?.uri : undefined,
      imageAspect: postKind === 'photo' && photo ? photo.height / photo.width : undefined,
      mediaLabel: postKind === 'photo' ? caption.trim().split(/[.!?\n]/)[0].slice(0, 40) : undefined,
      // Progress labels say "week 4", never the numbers: those stay private on the goal.
      progressLabel: kind === 'progress' ? (pickedGoal ? `${pickedGoal.title}, week ${weekNumber(pickedGoal)}` : goal.trim()) : undefined,
      goalId: kind === 'progress' && pickedGoal ? pickedGoal.id : undefined,
      premium: membersOnly && !!state.me.membership ? true : undefined,
    });
    actions.setNiche(nicheId);
    setPostedId(id);
  };

  const reset = () => {
    setCaption('');
    setGoal('');
    setGoalId(null);
    setPhoto(null);
    setPostedId(null);
    if (params.goalId) router.setParams({ goalId: undefined });
  };

  if (postedId) {
    return (
      <View style={[styles.done, { backgroundColor: niche.field, paddingTop: insets.top }]}>
        <View style={[styles.doneCheck, { backgroundColor: niche.accent }]}>
          <CheckIcon size={30} />
        </View>
        <DisplayText size={34} color={niche.ink}>{kind === 'progress' ? 'Progress shared' : `Posted to ${niche.label}`}</DisplayText>
        <Text style={[styles.doneBody, { color: niche.inkSoft }]}>It’s at the top of the {niche.label} feed now, newest first.</Text>
        <Button label="See your post" color={niche.accent} onPress={() => { const id = postedId; reset(); router.push({ pathname: '/post/[id]', params: { id } }); }} />
        <Button label="Back to the feed" tone="inverse" color={niche.ink} onPress={() => { reset(); router.navigate('/'); }} />
      </View>
    );
  }

  const kinds: { id: Kind; label: string }[] = [
    { id: 'post', label: 'Post' },
    { id: 'progress', label: 'Progress' },
    { id: 'question', label: 'Question' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.navTitle}>New post</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={share}
          style={[styles.share, { backgroundColor: niche.accent, opacity: ready ? 1 : 0.45 }]}>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.ground }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/plans/new', params: { niche: nicheId } })} style={[styles.planLink, { backgroundColor: niche.field }]}>
          <CalendarIcon size={20} color={niche.ink} />
          <Text style={[styles.planLinkText, { color: niche.ink }]}>Planning something instead? Make a plan</Text>
        </Pressable>
        <View accessibilityRole="radiogroup" accessibilityLabel="Post type" style={styles.segment}>
          {kinds.map((k) => {
            const selected = k.id === kind;
            return (
              <Pressable key={k.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setKind(k.id)} style={[styles.segmentOption, selected ? styles.segmentSelected : null]}>
                <Text style={[styles.segmentText, { color: selected ? colors.text : colors.textMuted }]}>{k.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {needsPhoto ? (
          photo ? (
            <View style={{ gap: 8 }}>
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel="Your photo"
                contentFit="cover"
                style={[styles.photo, { aspectRatio: 1 / Math.min(1.25, Math.max(0.8, photo.height / photo.width)), height: undefined, backgroundColor: LOADING_TINT }]}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button tone="outline" label="Change photo" style={{ flex: 1 }} onPress={choosePhoto} />
                <Button tone="ghost" label="Remove" onPress={() => setPhoto(null)} />
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" accessibilityState={{ busy: picking }} disabled={picking} onPress={choosePhoto} style={styles.picker}>
              <CameraIcon color={colors.textBody} />
              <Text style={styles.pickerTitle}>{picking ? 'Opening your photos…' : 'Add a photo'}</Text>
              <Text style={styles.hint}>From your camera roll. Videos up to 90 seconds come next.</Text>
            </Pressable>
          )
        ) : null}

        {kind === 'progress' ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Which goal is this progress toward?</Text>
            {myGoals.map((g) => {
              const on = g.id === goalId;
              return (
                <Pressable key={g.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setGoalId(g.id)} style={[styles.goalOption, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                  <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.goalTitle}>{g.title}</Text>
                    <Text style={styles.goalSub}>{goalRule(g)} · counts as a check-in</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: goalId === null }} onPress={() => setGoalId(null)} style={[styles.goalOption, goalId === null ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
              <View style={[styles.radio, goalId === null ? { borderColor: niche.accent } : null]}>{goalId === null ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
              <Text style={[styles.goalTitle, { flex: 1 }]}>{myGoals.length ? 'Something else' : 'Name what you’re working on'}</Text>
            </Pressable>
            {goalId === null ? (
              <TextInput accessibilityLabel="Goal" value={goal} onChangeText={setGoal} placeholder="e.g. Fresh pasta, week 4" placeholderTextColor="#6B7178" maxLength={60} style={styles.input} selectionColor={niche.accent} />
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/goals/new', params: { niche: nicheId } })} style={styles.newGoal}>
              <Text style={[styles.newGoalText, { color: niche.accent }]}>+ Set a new goal</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>{kind === 'question' ? 'Your question' : kind === 'progress' ? 'How did it go?' : 'Caption'}</Text>
          <TextInput
            accessibilityLabel="Caption"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2000}
            placeholder={kind === 'question' ? 'Ask the Cooking niche anything' : 'What did you make?'}
            placeholderTextColor="#6B7178"
            style={[styles.input, styles.textarea]}
            selectionColor={niche.accent}
          />
        </View>

        <View style={{ gap: 10 }}>
          {state.me?.membership ? (
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: membersOnly }} onPress={() => setMembersOnly(!membersOnly)} style={[styles.membersRow, membersOnly ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.membersTitle}>Members only</Text>
                <Text style={styles.membersSub}>Only your members can see it. Everyone else sees a locked preview.</Text>
              </View>
              <View style={[styles.switchTrack, membersOnly ? { backgroundColor: niche.accent } : null]}>
                <View style={[styles.switchKnob, membersOnly ? { transform: [{ translateX: 18 }] } : null]} />
              </View>
            </Pressable>
          ) : null}
          <Text style={styles.label}>Post to one niche</Text>
          <View style={styles.niches}>
            {NICHE_ORDER.map((id) => {
              const n = NICHES[id];
              const selected = id === nicheId;
              return (
                <View
                  key={id}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: !n.open }}
                  style={[styles.nicheChip, selected ? { backgroundColor: n.accent, borderColor: n.accent } : { backgroundColor: '#F7F8F5', borderColor: '#E3E5E1' }]}>
                  {selected ? <CheckIcon size={15} strokeWidth={2.6} /> : null}
                  <Text style={[styles.nicheChipText, { color: selected ? '#FFFFFF' : '#6B7178' }]}>{n.open ? n.label : `${n.label} · soon`}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.hint}>Your post shows in the {niche.label} feed and on your profile. Only you will see how many people liked or saved it.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline, backgroundColor: colors.ground },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  share: { minHeight: 36, paddingHorizontal: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  shareText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  form: { padding: 20, gap: 18 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  membersTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  membersSub: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  switchTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#D5D8D3', padding: 3 },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  planLink: { minHeight: TOUCH + 4, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  planLinkText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F0F1EE' },
  segmentOption: { flex: 1, minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: '#FFFFFF', shadowColor: '#14161A', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  picker: { height: 180, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9BFB8', backgroundColor: '#F7F8F5', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: colors.textBody },
  photo: { height: 220, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  niches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nicheChip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nicheChipText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
  goalOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  goalSub: { fontSize: 13, color: colors.textMuted },
  newGoal: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  newGoalText: { fontSize: 15, fontWeight: '700' },
  done: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 16 },
  doneCheck: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  doneBody: { fontSize: 16, lineHeight: 23 },
});
