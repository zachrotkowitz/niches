import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { CREATOR_FEE_RATE, creatorTake, PRICE_OPTIONS, STORE_FEE_RATE } from '@/lib/creators';
import { formatPrice } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

/** Where a premium creator sets their price and perks and sees (demo) earnings. */
export default function CreatorStudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const me = state.me;
  const m = me?.membership;
  const [price, setPrice] = useState(m?.priceCents ?? 399);
  const [tagline, setTagline] = useState(m?.tagline ?? '');
  const [perks, setPerks] = useState<string[]>(m?.perks ?? []);
  const [draft, setDraft] = useState('');
  const niche = niches[state.niche];
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  if (!me || !m) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }]}>
        <Text style={{ fontSize: 17, color: colors.text }}>Creator studio is for premium creators.</Text>
        <Button label="About the creator program" color={niche.accent} onPress={() => router.replace('/creators/apply')} />
      </View>
    );
  }

  const premiumPosts = state.posts.filter((p) => p.authorId === me.id && p.premium);
  const members = state.demoMembers;
  const split = creatorTake(price);
  const changed = price !== m.priceCents || tagline.trim() !== m.tagline || perks.join('|') !== m.perks.join('|');

  const save = () => {
    actions.updateMyMembership({ priceCents: price, tagline: tagline.trim() || m.tagline, perks: perks.length ? perks : m.perks });
    toast('Membership updated');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <DisplayText size={34}>Creator studio</DisplayText>

        <View style={[styles.earnings, { backgroundColor: niche.field }]}>
          <Text style={[styles.earningsLabel, { color: niche.inkSoft }]}>Monthly earnings (demo)</Text>
          <Text style={[styles.earningsValue, { color: niche.ink }]}>{formatPrice(split.take * members)}</Text>
          <Text style={[styles.earningsSub, { color: niche.inkSoft }]}>
            {members} {members === 1 ? 'member' : 'members'} · {premiumPosts.length} members-only {premiumPosts.length === 1 ? 'post' : 'posts'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Demo: add a member" tone="inverse" color={niche.ink} style={{ flex: 1, paddingHorizontal: 8 }} onPress={() => actions.setDemoMembers(members + 1)} />
            <Button label="Reset" tone="ghost" style={{ paddingHorizontal: 12 }} disabled={!members} onPress={() => actions.setDemoMembers(0)} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.section}>Monthly price</Text>
          <View style={styles.wrap}>
            {PRICE_OPTIONS.map((c) => {
              const on = c === price;
              return (
                <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPrice(c)} style={[styles.chip, on ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{formatPrice(c)}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.split} accessibilityLabel={`Of ${formatPrice(price)}, the app store takes ${formatPrice(split.store)}, Niches takes ${formatPrice(split.niches)}, you keep ${formatPrice(split.take)}`}>
            <Row label="Member pays" value={formatPrice(price)} />
            <Row label={`App store fee (est. ${Math.round(STORE_FEE_RATE * 100)}%)`} value={`− ${formatPrice(split.store)}`} />
            <Row label={`Niches (${Math.round(CREATOR_FEE_RATE * 100)}%)`} value={`− ${formatPrice(split.niches)}`} />
            <Row label="You keep" value={formatPrice(split.take)} bold />
            <Text style={styles.splitNote}>Apple and Google take 15–30% of digital subscriptions bought in the app. Members who join on the web could skip that fee.</Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Tagline</Text>
          <TextInput accessibilityLabel="Tagline" value={tagline} onChangeText={setTagline} maxLength={60} placeholder="What members get, in one line" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Perks</Text>
          {perks.map((p, i) => (
            <View key={`${p}-${i}`} style={styles.perkRow}>
              <Text style={styles.perkText}>{p}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p}`} onPress={() => setPerks(perks.filter((_, j) => j !== i))} style={styles.remove}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              accessibilityLabel="Add a perk"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => {
                if (draft.trim()) setPerks([...perks, draft.trim()]);
                setDraft('');
              }}
              placeholder="e.g. Monthly live cook-along"
              placeholderTextColor="#6B7178"
              maxLength={60}
              style={[styles.input, { flex: 1 }]}
              selectionColor={niche.accent}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add perk"
              onPress={() => {
                if (draft.trim()) setPerks([...perks, draft.trim()]);
                setDraft('');
              }}
              style={[styles.add, { backgroundColor: niche.accent, opacity: draft.trim() ? 1 : 0.4 }]}>
              <PlusIcon size={18} />
            </Pressable>
          </View>
        </View>

        <Button label="Save membership" color={niche.accent} disabled={!changed} onPress={save} />

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>Posting members-only</Text>
          <Text style={styles.tipBody}>When you create a post, turn on “Members only”. You can also switch any of your posts from its ⋯ menu. Non-members see a locked preview in the feed.</Text>
          <Button label="Create a members-only post" tone="outline" onPress={() => router.navigate('/create')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold ? styles.bold : null]}>{label}</Text>
      <Text style={[styles.rowValue, bold ? styles.bold : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { paddingHorizontal: 6 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  earnings: { padding: 16, borderRadius: 18, gap: 6 },
  earningsLabel: { fontSize: 13, fontWeight: '600' },
  earningsValue: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
  earningsSub: { fontSize: 14, marginBottom: 4 },
  section: { fontSize: 18, fontWeight: '700', color: colors.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  split: { padding: 14, borderRadius: 14, backgroundColor: colors.surface, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowLabel: { fontSize: 14, color: colors.textSecondary, flexShrink: 1 },
  rowValue: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '800', color: colors.text, fontSize: 16 },
  splitNote: { fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 4 },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  perkRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, borderRadius: 12, backgroundColor: colors.surface },
  perkText: { flex: 1, fontSize: 15, color: colors.text },
  remove: { minHeight: TOUCH, paddingHorizontal: 12, justifyContent: 'center' },
  removeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  add: { width: TOUCH + 4, height: TOUCH + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tip: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 8 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  tipBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
