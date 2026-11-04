import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedGrid } from '@/components/feed-grid';
import { SearchIcon } from '@/components/icons';
import { NicheFilter } from '@/components/niche-filter';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { SEED_USERS } from '@/lib/seed';
import { inspirationThisWeek, isVisible, useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';
import type { User } from '@/lib/types';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();
  const niches = useNiches();
  const [query, setQuery] = useState('');
  const [request, setRequest] = useState('');
  const [thanks, setThanks] = useState(false);
  const filter = state.discoverNiches;
  const allowed = new Set<NicheId>(filter.length ? filter : NICHE_ORDER);
  const accent = niches[filter.length === 1 ? filter[0] : state.niche].accent;

  // Which niches each person posts in.
  const nichesByUser = useMemo(() => {
    const map: Record<string, NicheId[]> = {};
    for (const p of state.posts) {
      if (!isVisible(state, p)) continue;
      const list = (map[p.authorId] ??= []);
      if (!list.includes(p.niche)) list.push(p.niche);
    }
    for (const id in map) map[id].sort((a, b) => NICHE_ORDER.indexOf(a) - NICHE_ORDER.indexOf(b));
    return map;
  }, [state]);

  const q = query.trim().toLowerCase().replace(/^@/, '');
  const people = SEED_USERS.filter((u) => u.id !== state.me?.id)
    .filter((u) => (q ? u.displayName.toLowerCase().includes(q) || u.username.includes(q) : (nichesByUser[u.id] ?? []).some((n) => allowed.has(n))))
    // People you don't follow yet come first.
    .sort((a, b) => Number(!!state.following[a.id]) - Number(!!state.following[b.id]));

  const inspiration = inspirationThisWeek(state, filter);

  const submit = () => {
    const name = request.trim();
    if (!name) return;
    actions.requestNiche(name);
    setRequest('');
    setThanks(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <DisplayText>Discover</DisplayText>
          <Text style={styles.sub}>Find people to follow and what everyone’s saving this week.</Text>
          <View style={styles.search}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              accessibilityLabel="Find people by name or username"
              value={query}
              onChangeText={setQuery}
              placeholder="Find people by name or username"
              placeholderTextColor="#6B7178"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
              selectionColor={accent}
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <NicheFilter value={filter} onChange={actions.setDiscoverNiches} />
        </View>

        <Text style={styles.section}>{q ? `People matching “${query.trim()}”` : 'People to follow'}</Text>
        {people.length === 0 ? (
          <Text style={styles.none}>{q ? 'No one by that name yet.' : 'No one posts in these niches yet.'}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people}>
            {people.map((u) => (
              <PersonCard key={u.id} user={u} nicheIds={nichesByUser[u.id] ?? []} />
            ))}
          </ScrollView>
        )}

        <Text style={styles.section}>Inspiration this week</Text>
        <Text style={styles.sectionSub}>The posts people saved most in the last 7 days, outlined in their niche’s color.</Text>
        {inspiration.length === 0 ? (
          <Text style={styles.none}>Nothing new in these niches this week.</Text>
        ) : (
          <FeedGrid posts={inspiration} nicheBorders />
        )}

        <View style={styles.request}>
          <Text style={styles.requestTitle}>Missing a niche?</Text>
          <Text style={styles.requestBody}>Tell us what should open next. We open the most-requested niches once their first creators sign on.</Text>
          <TextInput
            accessibilityLabel="Niche you want"
            value={request}
            onChangeText={(t) => {
              setRequest(t);
              setThanks(false);
            }}
            placeholder="e.g. Gardening, Climbing, Ceramics"
            placeholderTextColor="#6B7178"
            maxLength={40}
            onSubmitEditing={submit}
            returnKeyType="send"
            style={styles.input}
            selectionColor={accent}
          />
          <Button label="Send request" color={accent} disabled={!request.trim()} onPress={submit} />
          {thanks ? <Text accessibilityRole="alert" style={styles.thanks}>Thanks. We’ll count your vote.</Text> : null}
          {state.nicheRequests.length > 0 ? <Text style={styles.mine}>You’ve asked for: {state.nicheRequests.join(', ')}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PersonCard({ user, nicheIds }: { user: User; nicheIds: NicheId[] }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const niches = useNiches();
  const following = !!state.following[user.id];
  const accent = niches[nicheIds[0] ?? 'cooking'].accent;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${user.displayName}’s profile`} onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })} style={styles.cardTop}>
        <Avatar user={user} size={56} />
        <Text style={styles.cardName} numberOfLines={1}>{user.displayName}</Text>
        <Text style={styles.cardHandle} numberOfLines={1}>{user.username}</Text>
        <View style={styles.cardNiches} accessibilityLabel={`Posts in ${nicheIds.map((n) => niches[n].label).join(', ')}`}>
          {nicheIds.map((n) => (
            <View key={n} style={[styles.cardNiche, { borderColor: niches[n].accent }]}>
              <Text style={[styles.cardNicheText, { color: niches[n].ink }]}>{niches[n].label}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
        accessibilityLabel={following ? `Following ${user.username}` : `Follow ${user.username}`}
        onPress={() => actions.toggleFollow(user.id)}
        style={({ pressed }) => [styles.follow, following ? { backgroundColor: '#FFFFFF', borderColor: colors.border } : { backgroundColor: accent, borderColor: accent }, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
        <Text style={[styles.followText, { color: following ? colors.textBody : '#FFFFFF' }]}>{following ? 'Following' : 'Follow'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  head: { paddingHorizontal: 20, gap: 8 },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  search: { marginTop: 8, minHeight: TOUCH + 2, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, minHeight: TOUCH, fontSize: 16, color: colors.text },
  section: { fontSize: 19, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 26 },
  sectionSub: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 20, marginTop: 4, lineHeight: 19 },
  none: { fontSize: 15, color: colors.textMuted, paddingHorizontal: 20, paddingTop: 10 },
  people: { gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  card: { width: 168, padding: 14, borderRadius: 20, backgroundColor: colors.surface, gap: 12, justifyContent: 'space-between' },
  cardTop: { alignItems: 'center', gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  cardHandle: { fontSize: 13, color: colors.textMuted },
  cardNiches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 6 },
  cardNiche: { borderWidth: 2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFFFFF' },
  cardNicheText: { fontSize: 11, fontWeight: '700' },
  follow: { minHeight: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  followText: { fontSize: 14, fontWeight: '700' },
  request: { margin: 20, marginTop: 32, padding: 18, borderRadius: 20, backgroundColor: colors.surface, gap: 12 },
  requestTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  requestBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  thanks: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  mine: { fontSize: 13, color: colors.textMuted },
});
