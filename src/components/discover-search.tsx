import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Eyebrow, PersonRow, SectionTitle, ShopTile } from '@/components/discover-parts';
import { FeedGrid } from '@/components/feed-grid';
import { SearchIcon } from '@/components/icons';
import { PlanCard } from '@/components/plan-card';
import { ListingGrid } from '@/components/shop';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { UnderlineTabs } from '@/components/underline-tabs';
import { relatedSearches, searchListings, searchPeople, searchPlans, searchPosts, suggestions, type Suggestion } from '@/lib/discover';
import { useNiches, useStore } from '@/lib/store';
import { TOUCH } from '@/lib/theme';

/** Bolds the part of `text` that matches the search, like Instagram's suggestions. */
function Highlight({ text, q }: { text: string; q: string }) {
  const surface = useSurface();
  const i = q ? text.indexOf(q) : -1;
  if (i < 0) return <Text style={[styles.suggestText, { color: surface.text }]}>{text}</Text>;
  return (
    <Text style={[styles.suggestText, { color: surface.text }]} numberOfLines={1}>
      {text.slice(0, i)}
      <Text style={{ fontWeight: '700' }}>{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </Text>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 3, width: 2, height: 5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 7, left: 7, width: 4, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

/** The search screen while you type: suggestions, people, and your recent searches. */
export function SearchSuggestions({ q, onPick }: { q: string; onPick: (text: string) => void }) {
  const surface = useSurface();
  const niches = useNiches();
  const { state, actions } = useStore();
  const picks = suggestions(state, q);
  const people = searchPeople(state, q).slice(0, 3);
  const recent = state.recentSearches;

  const tag = (s: Suggestion) => {
    if (!s.niche) return null;
    const n = niches[s.niche];
    return (
      // The niche shows as an underline in its color, like the posts' borders. No pill.
      <View style={[styles.tagLine, { borderBottomColor: n.accent }]}>
        <Text style={[styles.tag, { color: surface.muted }]}>{s.plan ? `${n.label} plan` : n.label}</Text>
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
      {picks.map((s) => (
        <Pressable key={s.text} accessibilityRole="button" accessibilityLabel={`Search for ${s.text}`} onPress={() => onPick(s.text)} style={styles.suggest}>
          <SearchIcon size={18} color={surface.muted} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Highlight text={s.text} q={q} />
          </View>
          {tag(s)}
        </Pressable>
      ))}

      {people.length ? (
        <View style={{ marginTop: 14 }}>
          <Eyebrow style={{ marginBottom: 4 }}>People</Eyebrow>
          {people.map((u) => (
            <PersonRow key={u.id} user={u} subtitle={u.bio ? `${u.username} · ${u.bio}` : u.username} onPress={() => onPick(u.username)} />
          ))}
        </View>
      ) : null}

      {q && !picks.length && !people.length ? <Text style={[styles.hint, { color: surface.muted }]}>Press search to look for “{q}” everywhere.</Text> : null}

      {recent.length ? (
        <View style={{ marginTop: 16 }}>
          <View style={styles.recentHead}>
            <Eyebrow>Recent</Eyebrow>
            <Pressable accessibilityRole="button" onPress={() => actions.setRecentSearches([])} hitSlop={8} style={styles.clearAll}>
              <Text style={[styles.clearAllText, { color: surface.text }]}>Clear all</Text>
            </Pressable>
          </View>
          {recent.map((r, i) => (
            <View key={r} style={[styles.recent, { borderTopColor: surface.line }, i === recent.length - 1 ? { borderBottomWidth: 1, borderBottomColor: surface.line } : null]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Search for ${r}`} onPress={() => onPick(r)} style={styles.recentMain}>
                <ClockIcon color={surface.muted} />
                <Text style={[styles.recentText, { color: surface.text }]} numberOfLines={1}>{r}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${r}`} onPress={() => actions.setRecentSearches(recent.filter((x) => x !== r))} style={styles.remove}>
                <Text style={[styles.removeText, { color: surface.muted }]}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : !q ? (
        <Text style={[styles.hint, { color: surface.muted }]}>Try “pasta”, “golden hour”, “watercolor” or someone’s username.</Text>
      ) : null}
    </View>
  );
}

type Kind = 'top' | 'people' | 'posts' | 'shop' | 'plans';

/** Search results in tabs, Instagram-style: Top, People, Posts, Shop, Plans. */
export function SearchResults({ q, onSearch }: { q: string; onSearch: (text: string) => void }) {
  const surface = useSurface();
  const { state, usersById } = useStore();
  const [kind, setKind] = useState<Kind>('top');
  const people = searchPeople(state, q);
  const posts = searchPosts(state, usersById, q);
  const listings = searchListings(state, q);
  const plans = searchPlans(state, q);
  const related = relatedSearches(state, q, posts);
  const nothing = !people.length && !posts.length && !listings.length && !plans.length;

  const none = (what: string) => <Text style={[styles.none, { color: surface.muted }]}>No {what} for “{q}” yet.</Text>;

  return (
    <View>
      <View style={{ marginTop: 10 }}>
        <UnderlineTabs
          label="Result types"
          value={kind}
          onChange={(k) => setKind(k as Kind)}
          items={[
            { key: 'top', label: 'Top' },
            { key: 'people', label: 'People' },
            { key: 'posts', label: 'Posts' },
            { key: 'shop', label: 'Shop' },
            { key: 'plans', label: 'Plans' },
          ]}
        />
      </View>

      {kind === 'top' ? (
        nothing ? (
          <Text style={[styles.none, { color: surface.muted }]}>Nothing for “{q}” yet. Try a dish, a technique or a username.</Text>
        ) : (
          <>
            {people.length ? (
              <View style={styles.block}>
                <SectionTitle>People</SectionTitle>
                <View style={styles.rows}>
                  {people.slice(0, 3).map((u) => (
                    <PersonRow key={u.id} user={u} />
                  ))}
                </View>
              </View>
            ) : null}
            {posts.length ? (
              <View style={styles.block}>
                <SectionTitle>Posts</SectionTitle>
                <FeedGrid posts={posts.slice(0, 6)} nicheBorders />
                {posts.length > 6 ? (
                  <Pressable accessibilityRole="button" onPress={() => setKind('posts')} style={styles.more}>
                    <Text style={[styles.moreText, { color: surface.text }]}>See all posts</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {related.length ? (
              <View style={[styles.block, { paddingHorizontal: 20 }]}>
                <Eyebrow style={{ marginBottom: 6 }}>Related searches</Eyebrow>
                {related.map((r, i) => (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${r}`}
                    onPress={() => onSearch(r)}
                    style={[styles.related, { borderTopColor: surface.line }, i === related.length - 1 ? { borderBottomWidth: 1, borderBottomColor: surface.line } : null]}>
                    <SearchIcon size={17} color={surface.muted} />
                    <Text style={[styles.relatedText, { color: surface.text }]} numberOfLines={1}>{r}</Text>
                    <Text style={[styles.relatedArrow, { color: surface.muted }]}>↗</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {listings.length ? (
              <View style={styles.block}>
                <SectionTitle>In the shops</SectionTitle>
                <View style={styles.shopRow}>
                  {listings.slice(0, 2).map((l) => (
                    <ShopTile key={l.id} listing={l} width={160} />
                  ))}
                </View>
              </View>
            ) : null}
            {plans.length ? (
              <View style={styles.block}>
                <SectionTitle>Plans</SectionTitle>
                <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 10 }}>
                  {plans.slice(0, 2).map((p) => (
                    <PlanCard key={p.id} plan={p} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )
      ) : null}

      {kind === 'people' ? (
        people.length ? (
          <View style={[styles.rows, { marginTop: 8 }]}>
            {people.map((u) => (
              <PersonRow key={u.id} user={u} subtitle={u.bio ? `${u.username} · ${u.bio}` : u.username} />
            ))}
          </View>
        ) : (
          none('people')
        )
      ) : null}
      {kind === 'posts' ? (posts.length ? <FeedGrid posts={posts} nicheBorders /> : none('posts')) : null}
      {kind === 'shop' ? (listings.length ? <ListingGrid listings={listings} nicheBorders /> : none('shop items')) : null}
      {kind === 'plans' ? (
        plans.length ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 10 }}>
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </View>
        ) : (
          none('plans')
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  suggest: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 14 },
  suggestText: { fontSize: 17 },
  tagLine: { borderBottomWidth: 2, paddingBottom: 1 },
  tag: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 15, lineHeight: 21, marginTop: 14 },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearAll: { minHeight: TOUCH, justifyContent: 'center' },
  clearAllText: { fontSize: 13, fontWeight: '700' },
  recent: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, minHeight: 48 },
  recentMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 },
  recentText: { fontSize: 16, flexShrink: 1 },
  remove: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  removeText: { fontSize: 20 },
  none: { fontSize: 15, lineHeight: 21, paddingHorizontal: 20, paddingTop: 20 },
  block: { marginTop: 22 },
  rows: { paddingHorizontal: 20, paddingTop: 6 },
  more: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  moreText: { fontSize: 14, fontWeight: '700' },
  related: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1 },
  relatedText: { flex: 1, fontSize: 16 },
  relatedArrow: { fontSize: 16 },
  shopRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
});
