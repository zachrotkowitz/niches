import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, StarIcon, VerifiedIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH } from '@/lib/theme';

/** The creator program: what it is, and requesting an invite. Invite-only for now. */
export default function BecomeCreatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const app = state.creatorApplication;
  const isCreator = !!state.me?.membership;
  const [niche, setNiche] = useState(niches[state.niche].label);
  const [links, setLinks] = useState('');
  const [why, setWhy] = useState('');
  const accent = niches[state.niche].accent;
  const field = niches[state.niche].field;
  const ink = niches[state.niche].ink;
  const ready = links.trim().length > 3 && why.trim().length > 10;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <DisplayText size={34}>Creators on Niches</DisplayText>
        <Text style={styles.lead}>Share your best work with the people who care most, and get paid for it. The program is invite-only while we start.</Text>

        <View style={styles.perks}>
          <Perk icon={<VerifiedIcon size={22} />} title="Verified" body="A blue check for notable cooks, artists and photographers, after we confirm who you are." />
          <Perk icon={<View style={styles.star}><StarIcon size={13} color="#FFFFFF" /></View>} title="Premium creator" body="Charge a monthly membership or a one-time price for members-only posts: full recipes, process videos, raw files." />
          <Perk icon={<CheckIcon size={20} color={accent} strokeWidth={3} />} title="No chasing the algorithm" body="Members see your posts because they chose you. Feeds stay newest-first for everyone." />
        </View>

        {isCreator ? (
          <View style={[styles.status, { backgroundColor: field }]}>
            <Text style={[styles.statusTitle, { color: ink }]}>You’re a premium creator</Text>
            <Text style={[styles.statusBody, { color: ink }]}>Set your price and perks, and mark posts as members-only when you share them.</Text>
            <Button label="Open Creator studio" color={accent} onPress={() => router.replace('/creators/studio')} />
          </View>
        ) : app?.status === 'pending' ? (
          <View style={[styles.status, { backgroundColor: field }]}>
            <Text style={[styles.statusTitle, { color: ink }]}>Invite requested</Text>
            <Text style={[styles.statusBody, { color: ink }]}>We review every request by hand. You’ll get a notice when you’re in.</Text>
            <Button
              label="Demo: approve my invite"
              tone="inverse"
              color={ink}
              onPress={() => {
                actions.approveMyApplication(app);
                toast('You’re in! Welcome to the creator program.');
                router.replace('/creators/studio');
              }}
            />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Text style={styles.section}>Request an invite</Text>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Main niche</Text>
              <View style={styles.wrap}>
                {NICHE_ORDER.map((id) => {
                  const on = niches[id].label === niche;
                  return (
                    <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setNiche(niches[id].label)} style={[styles.chip, { borderColor: niches[id].accent }, on ? { backgroundColor: niches[id].accent } : null]}>
                      <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{niches[id].label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Where can we see your work?</Text>
              <TextInput accessibilityLabel="Links to your work" value={links} onChangeText={setLinks} placeholder="Instagram, TikTok, website, restaurant…" placeholderTextColor="#6B7178" autoCapitalize="none" style={styles.input} selectionColor={accent} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>What would members get?</Text>
              <TextInput accessibilityLabel="What members would get" value={why} onChangeText={setWhy} multiline maxLength={500} placeholder="e.g. A full recipe video every week and my restaurant’s prep notes" placeholderTextColor="#6B7178" style={[styles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]} selectionColor={accent} />
            </View>
            <Button
              label="Request an invite"
              color={accent}
              disabled={!ready}
              onPress={() => {
                actions.applyToCreate({ niche, links: links.trim(), why: why.trim() });
                toast('Request sent');
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={styles.perk}>
      <View style={styles.perkIcon}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.perkTitle}>{title}</Text>
        <Text style={styles.perkBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  nav: { paddingHorizontal: 6 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  lead: { fontSize: 16, lineHeight: 23, color: colors.textSecondary },
  perks: { gap: 14, padding: 16, borderRadius: 18, backgroundColor: colors.surface },
  perk: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  perkIcon: { width: 28, alignItems: 'center', paddingTop: 1 },
  star: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  perkBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  status: { padding: 18, borderRadius: 18, gap: 10 },
  statusTitle: { fontSize: 18, fontWeight: '800' },
  statusBody: { fontSize: 15, lineHeight: 21 },
  section: { fontSize: 19, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
});
