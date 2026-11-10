import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink, EndNote, Eyebrow, PersonRow, SearchBar, SectionTitle } from '@/components/discover-parts';
import { FeedGrid } from '@/components/feed-grid';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { UnderlineTabs } from '@/components/underline-tabs';
import { normalize, weekFavorites, weekOfLabel } from '@/lib/discover';
import { SEED_USERS } from '@/lib/seed';
import { inFeeds, useAppGround, useNiches, useStore } from '@/lib/store';
import { floodSurface, fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';
import { matchesTopic, postText, TOPICS } from '@/lib/topics';

/**
 * A niche's page on Discover: its most-saved posts this week as a Pinterest
 * grid, with topics to narrow it down and people to follow. It belongs to one
 * niche, so it fills with that niche's color like Home does. "all" shows this
 * week's favorites from every niche on the app background, with niche borders.
 */
export default function DiscoverNicheScreen() {
  const { niche: param } = useLocalSearchParams<{ niche: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ground = useAppGround();
  const [topic, setTopic] = useState('all');
  const [text, setText] = useState('');

  const all = param === 'all';
  const nicheId = (NICHE_ORDER as string[]).includes(param ?? '') ? (param as NicheId) : null;
  const niche = nicheId ? niches[nicheId] : null;
  const surface = niche ? floodSurface(niche) : groundSurface(ground);
  const background = niche ? niche.mid : ground.ground;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  const favorites = useMemo(() => weekFavorites(state, nicheId ? [nicheId] : [], 8), [state, nicheId]);
  // Only topics that have something in them this week.
  const topics = useMemo(() => (nicheId ? TOPICS[nicheId].filter((t) => favorites.posts.some((p) => matchesTopic(p, t))) : []), [nicheId, favorites]);
  const q = normalize(text);
  const chosen = topics.find((t) => t.id === topic);
  const shown = favorites.posts.filter((p) => (!chosen || matchesTopic(p, chosen)) && (!q || postText(p).includes(q) || (usersById[p.authorId]?.username ?? '').includes(q)));

  // People who post in this niche, the ones you don't follow first.
  const people = useMemo(() => {
    if (!nicheId) return [];
    const ids = new Set(state.posts.filter((p) => p.niche === nicheId && inFeeds(state, p)).map((p) => p.authorId));
    return SEED_USERS.filter((u) => ids.has(u.id) && u.id !== state.me?.id)
      .sort((a, b) => Number(!!state.following[a.id]) - Number(!!state.following[b.id]))
      .slice(0, 3);
  }, [state, nicheId]);

  if (!all && (!niche || !niche.open)) {
    return (
      <SurfaceProvider value={surface}>
        <View style={[styles.screen, { backgroundColor: background, paddingTop: insets.top + 4, paddingHorizontal: 14 }]}>
          <BackLink label="Discover" onPress={goBack} />
          <View style={{ padding: 6, gap: 14, marginTop: 20 }}>
            <DisplayText italic size={48} color={surface.text}>{niche?.label ?? 'Not found'}</DisplayText>
            <Text style={{ fontSize: 16, lineHeight: 22, color: surface.body }}>{niche ? 'This niche is opening soon.' : 'This niche doesn’t exist.'}</Text>
            {niche ? <Button label={state.notify[niche.id] ? 'We’ll let you know' : 'Notify me'} color={surface.text} onPress={() => actions.toggleNotify(niche.id)} /> : null}
          </View>
        </View>
      </SurfaceProvider>
    );
  }

  const label = niche?.label;
  const heading = favorites.lately ? 'Saved most lately' : 'Saved most this week';

  return (
    <SurfaceProvider value={surface}>
      <ScrollView style={[styles.screen, { backgroundColor: background }]} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 14 }}>
          <BackLink label="Discover" onPress={goBack} />
        </View>
        <View style={styles.head}>
          <Eyebrow>{weekOfLabel()}</Eyebrow>
          {niche ? (
            <DisplayText italic size={60} color={surface.text}>{niche.label}</DisplayText>
          ) : (
            <DisplayText size={44} color={surface.text}>
              This week’s <Text style={{ fontFamily: fonts.displayItalic }}>favorites</Text>
            </DisplayText>
          )}
          <View style={{ marginTop: 12 }}>
            <SearchBar compact value={text} onChangeText={setText} placeholder={label ? `Search ${label}…` : 'Search this week’s favorites…'} accessibilityLabel={label ? `Search ${label}` : 'Search favorites'} onClear={() => setText('')} />
          </View>
        </View>

        {topics.length ? (
          <View style={{ marginTop: 14 }}>
            <UnderlineTabs label={`${label} topics`} value={topic} onChange={setTopic} items={[{ key: 'all', label: 'All' }, ...topics.map((t) => ({ key: t.id, label: t.label }))]} />
          </View>
        ) : null}

        <View style={{ marginTop: 22 }}>
          {niche ? <SectionTitle>{heading}</SectionTitle> : null}
          {shown.length ? (
            <FeedGrid posts={shown} nicheBorders={all} />
          ) : (
            <Text style={[styles.none, { color: surface.muted }]}>{q ? `Nothing matches “${text.trim()}” here.` : 'Nothing here this week yet.'}</Text>
          )}
        </View>

        {people.length && niche ? (
          <View style={{ marginTop: 30 }}>
            <SectionTitle>
              People to follow in <Text style={{ fontFamily: fonts.displayItalic }}>{niche.label}</Text>
            </SectionTitle>
            <View style={[styles.rows, { borderBottomColor: surface.line }]}>
              {people.map((u) => (
                <PersonRow key={u.id} user={u} subtitle={u.bio ?? u.username} />
              ))}
            </View>
          </View>
        ) : null}

        <EndNote title={niche ? `That’s this week in ${niche.label}.` : 'That’s this week’s favorites.'} body={niche ? undefined : 'New picks every Monday.'}>
          {niche ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                actions.setNiche(niche.id);
                router.navigate('/');
              }}
              style={styles.feedLink}>
              <Text style={[styles.feedLinkText, { color: surface.text }]}>Open the {niche.label} feed →</Text>
            </Pressable>
          ) : null}
        </EndNote>
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: 6, gap: 4 },
  none: { fontSize: 15, lineHeight: 21, paddingHorizontal: 20, paddingTop: 14 },
  rows: { marginHorizontal: 20, marginTop: 8, borderBottomWidth: 1 },
  feedLink: { minHeight: TOUCH, justifyContent: 'center', alignSelf: 'flex-start' },
  feedLinkText: { fontSize: 15, fontWeight: '700' },
});
