import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon, CheckIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';
import type { PostKind } from '@/lib/types';

type Kind = 'post' | 'progress' | 'question';

// Until photo uploads exist, a picked "photo" is a colored placeholder.
const SWATCHES = ['#C8553D', '#C9A877', '#6E8B4E', '#E0A43A', '#8E2F4F', '#B9783F', '#5E2A22', '#2B2B2E'];

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const [kind, setKind] = useState<Kind>('post');
  const [caption, setCaption] = useState('');
  const [goal, setGoal] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [nicheId] = useState<NicheId>('cooking');
  const [postedId, setPostedId] = useState<string | null>(null);

  const niche = NICHES[nicheId];
  const needsPhoto = kind !== 'question';
  const ready = caption.trim().length > 0 && (kind !== 'progress' || goal.trim().length > 0);

  const share = () => {
    if (!ready || !state.me) return;
    const postKind: PostKind = kind === 'question' || !photo ? 'text' : 'photo';
    const id = actions.createPost({
      authorId: state.me.id,
      niche: nicheId,
      kind: postKind,
      caption: caption.trim(),
      mediaColor: postKind === 'photo' ? photo ?? undefined : undefined,
      mediaLabel: postKind === 'photo' ? caption.trim().split(/[.!?\n]/)[0].slice(0, 40) : undefined,
      progressLabel: kind === 'progress' ? goal.trim() : undefined,
    });
    actions.setNiche(nicheId);
    setPostedId(id);
  };

  const reset = () => {
    setCaption('');
    setGoal('');
    setPhoto(null);
    setPostedId(null);
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
              <View accessibilityRole="image" accessibilityLabel="Your photo (placeholder)" style={[styles.photo, { backgroundColor: photo }]}>
                <CameraIcon />
              </View>
              <Button tone="ghost" label="Remove photo" onPress={() => setPhoto(null)} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setPhoto(SWATCHES[Math.floor(Math.random() * SWATCHES.length)])} style={styles.picker}>
              <CameraIcon color={colors.textBody} />
              <Text style={styles.pickerTitle}>Add a photo</Text>
              <Text style={styles.hint}>Demo: adds a placeholder. Real photos and 90-second videos come next.</Text>
            </Pressable>
          )
        ) : null}

        {kind === 'progress' ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Which goal is this progress toward?</Text>
            <TextInput accessibilityLabel="Goal" value={goal} onChangeText={setGoal} placeholder="e.g. Fresh pasta, week 4" placeholderTextColor="#6B7178" maxLength={60} style={styles.input} selectionColor={niche.accent} />
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

        <Text style={styles.hint}>Your post shows in the {niche.label} feed and on your profile. Only you will see how many people cheered or saved it.</Text>
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
  done: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 16 },
  doneCheck: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  doneBody: { fontSize: 16, lineHeight: 23 },
});
