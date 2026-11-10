import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EndNote, Eyebrow, NicheCard, PersonRow, RailTile, SearchBar, SectionTitle, ShopTile } from '@/components/discover-parts';
import { SearchResults, SearchSuggestions } from '@/components/discover-search';
import { ChevronLeftIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { normalize, weekFavorites, weekOfLabel } from '@/lib/discover';
import { postPhoto } from '@/lib/demo-photos';
import { SEED_USERS } from '@/lib/seed';
import { inFeeds, postStats, useAppGround, useNiches, useStore } from '@/lib/store';
import { groundSurface, NICHE_ORDER, TOUCH } from '@/lib/theme';

type Mode = 'browse' | 'typing' | 'results';

/**
 * Discover (founder's combined design, Nov 2026): a weekly masthead and search,
 * Explore by niche, this week's favorites, creators to know and the shops.
 * Search is Instagram-style (suggestions, then results in tabs) with Pinterest's
 * grid and related searches. Like every feed, it ends.
 */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = useAppGround();
  const surface = groundSurface(ground);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [mode, setMode] = useState<Mode>('browse');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [request, setRequest] = useState('');
  const [thanks, setThanks] = useState(false);

  const favorites = useMemo(() => weekFavorites(state, []), [state]);
  // Collage photos per niche: its most-saved posts that have a picture.
  const byNiche = useMemo(() => {
    const out: Record<string, ReturnType<typeof weekFavorites>['posts']> = {};
    for (const id of NICHE_ORDER) out[id] = weekFavorites(state, [id], 3).posts.filter((p) => p.kind !== 'text' && postPhoto(p));
    return out;
  }, [state]);

  // Creators to know: verified and premium creators, each with their most-saved photo.
  const creators = useMemo(
    () =>
      SEED_USERS.filter((u) => (u.verified || u.membership) && u.id !== state.me?.id).map((u) => {
        const best = state.posts
          .filter((p) => p.authorId === u.id && inFeeds(state, p) && p.kind !== 'text' && postPhoto(p))
          .sort((a, b) => postStats(state, b).saves - postStats(state, a).saves)[0];
        return { user: u, thumb: best };
      }),
    [state],
  );
  const shopPicks = state.listings
    .filter((l) => l.sellerId !== state.me?.id && l.stock !== 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);
  const shopW = Math.floor((Math.min(width, 520) - 40 - 12) / 2);

  const runSearch = (raw: string) => {
    const q = normalize(raw);
    if (!q) return;
    setText(raw.trim());
    setQuery(q);
    setMode('results');
    input.current?.blur();
    actions.setRecentSearches([q, ...state.recentSearches.filter((r) => r !== q)]);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const cancel = () => {
    setText('');
    setQuery('');
    setMode('browse');
    input.current?.blur();
  };
  const submitRequest = () => {
    const name = request.trim();
    if (!name) return;
    actions.requestNiche(name);
    setRequest('');
    setThanks(true);
  };

  const searching = mode !== 'browse';

  return (
    <SurfaceProvider value={surface}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (searching ? 10 : 16), paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* The masthead hides while you search; the search bar stays the same element so it keeps focus. */}
          {searching ? null : (
            <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
              <DisplayText size={42} color={ground.text}>Discover</DisplayText>
              <Eyebrow>{weekOfLabel()}</Eyebrow>
            </View>
          )}
          <View style={[styles.searchRow, searching ? { paddingLeft: mode === 'results' ? 8 : 20 } : null]}>
            {mode === 'results' ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Back to Discover" onPress={cancel} style={styles.backBtn}>
                <ChevronLeftIcon size={22} color={ground.text} />
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
              <SearchBar
                ref={input}
                compact={mode === 'results'}
                focused={mode === 'typing'}
                value={text}
                onChangeText={setText}
                onFocus={() => setMode('typing')}
                onSubmitEditing={() => runSearch(text)}
                onClear={mode === 'typing' ? () => setText('') : undefined}
                placeholder="Search dishes, people, prints…"
                accessibilityLabel="Search Niches"
              />
            </View>
            {mode === 'typing' ? (
              <Pressable accessibilityRole="button" onPress={cancel} style={styles.cancel}>
                <Text style={[styles.cancelText, { color: ground.text }]}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>

          {mode === 'typing' ? <SearchSuggestions q={normalize(text)} onPick={runSearch} /> : null}
          {mode === 'results' ? <SearchResults key={query} q={query} onSearch={runSearch} /> : null}

          {searching ? null : (
            <>
              <View style={styles.block}>
                <SectionTitle>Explore by niche</SectionTitle>
                <View style={styles.nicheGrid}>
                  {NICHE_ORDER.map((id) => {
                    const n = niches[id];
                    return (
                      <NicheCard
                        key={id}
                        niche={n}
                        posts={byNiche[id]}
                        notified={!!state.notify[id]}
                        onPress={() => (n.open ? router.push({ pathname: '/discover/[niche]', params: { niche: id } }) : actions.toggleNotify(id))}
                      />
                    );
                  })}
                </View>
              </View>

              {favorites.posts.length ? (
                <View style={styles.block}>
                  <SectionTitle
                    right={
                      <Pressable accessibilityRole="button" accessibilityLabel="See all of this week’s favorites" onPress={() => router.push({ pathname: '/discover/[niche]', params: { niche: 'all' } })} style={styles.seeAll}>
                        <Text style={[styles.seeAllText, { color: ground.text }]}>See all</Text>
                      </Pressable>
                    }>
                    {favorites.lately ? 'Favorites lately' : 'This week’s favorites'}
                  </SectionTitle>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                    {favorites.posts.slice(0, 10).map((p) => (
                      <RailTile key={p.id} post={p} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {creators.length ? (
                <View style={styles.block}>
                  <SectionTitle>Creators to know</SectionTitle>
                  <View style={[styles.rows, { borderBottomColor: ground.line }]}>
                    {creators.map(({ user, thumb }) => (
                      <PersonRow key={user.id} user={user} subtitle={user.membership?.tagline ?? user.bio} serifSubtitle thumb={thumb} />
                    ))}
                  </View>
                </View>
              ) : null}

              {shopPicks.length ? (
                <View style={styles.block}>
                  <SectionTitle>From the shops</SectionTitle>
                  <View style={styles.shopGrid}>
                    {shopPicks.map((l) => (
                      <ShopTile key={l.id} listing={l} width={shopW} />
                    ))}
                  </View>
                </View>
              ) : null}

              <EndNote title="That’s this week’s favorites." body="New picks every Monday. Search for anything else." />

              <View style={[styles.request, { borderColor: ground.line }]}>
                <Text style={[styles.requestTitle, { color: ground.text }]}>Missing a niche?</Text>
                <Text style={[styles.requestBody, { color: ground.body }]}>Tell us what should open next. We open the most-requested niches once their first creators sign on.</Text>
                <TextInput
                  accessibilityLabel="Niche you want"
                  value={request}
                  onChangeText={(t) => {
                    setRequest(t);
                    setThanks(false);
                  }}
                  placeholder="e.g. Gardening, Climbing, Ceramics"
                  placeholderTextColor={ground.muted}
                  maxLength={40}
                  onSubmitEditing={submitRequest}
                  returnKeyType="send"
                  style={[styles.input, { borderColor: ground.line, color: ground.text }]}
                  selectionColor={ground.text}
                />
                <Button label="Send request" color={ground.text} disabled={!request.trim()} onPress={submitRequest} />
                {thanks ? <Text accessibilityRole="alert" style={[styles.requestBody, { color: ground.body }]}>Thanks. We’ll count your vote.</Text> : null}
                {state.nicheRequests.length > 0 ? <Text style={[styles.mine, { color: ground.muted }]}>You’ve asked for: {state.nicheRequests.join(', ')}</Text> : null}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  masthead: { marginHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginTop: 14 },
  backBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  cancel: { minHeight: TOUCH, paddingHorizontal: 8, justifyContent: 'center', marginRight: -8 },
  cancelText: { fontSize: 16, fontWeight: '600' },
  block: { marginTop: 30 },
  nicheGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, columnGap: 12, paddingHorizontal: 20, paddingTop: 12 },
  rail: { gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  seeAll: { minHeight: TOUCH, justifyContent: 'center' },
  seeAllText: { fontSize: 14, fontWeight: '700' },
  rows: { marginHorizontal: 20, marginTop: 8, borderBottomWidth: 1 },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, columnGap: 12, paddingHorizontal: 20, paddingTop: 12 },
  request: { margin: 20, marginTop: 28, padding: 18, borderRadius: 20, borderWidth: 1, backgroundColor: '#FFFFFF', gap: 12 },
  requestTitle: { fontSize: 17, fontWeight: '700' },
  requestBody: { fontSize: 14, lineHeight: 20 },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#FFFFFF' },
  mine: { fontSize: 13 },
});
