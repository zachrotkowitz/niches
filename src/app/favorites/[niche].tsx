import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReorderRow } from '@/components/reorder-row';
import { useToast } from '@/components/toast';
import { formatRating } from '@/components/diary';
import { logPhoto, postPhoto } from '@/lib/demo-photos';
import type { Photo } from '@/lib/demo-photos';
import { diaryWords, MAX_FAVORITES, type FavoriteRef } from '@/lib/diary';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

type Option = { ref: FavoriteRef; title: string; sub: string; image?: Photo; color?: string };

/** Pick your Top 4 for a niche, from your diary, your posts and posts you saved. */
export default function FavoritesScreen() {
  const params = useLocalSearchParams<{ niche: NicheId; add?: string }>();
  const niche = NICHE_ORDER.includes(params.niche) ? params.niche : 'cooking';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const n = useNiches()[niche];
  const words = diaryWords(niche);
  const meId = state.me?.id ?? '';
  const current = state.favorites[meId]?.[niche] ?? [];
  // Opened from a post's ⋯ menu with a full Top 4: that post goes in, and you pick which one it replaces.
  const adding = params.add && !current.some((r) => r.kind === 'post' && r.id === params.add) ? params.add : undefined;
  const [picked, setPicked] = useState<FavoriteRef[]>(adding ? [...current.slice(0, MAX_FAVORITES - 1), { kind: 'post', id: adding }] : current);

  const key = (r: FavoriteRef) => `${r.kind}:${r.id}`;
  const options: { title: string; items: Option[] }[] = [
    {
      title: `From your ${words.diary.toLowerCase()}`,
      items: state.logs
        .filter((l) => l.userId === meId && l.niche === niche)
        .map((l) => ({ ref: { kind: 'log', id: l.id }, title: l.title, sub: `${formatRating(l.rating)}★ · ${l.date}`, image: logPhoto(l), color: l.mediaColor })),
    },
    {
      title: 'Your posts',
      items: state.posts
        .filter((p) => p.authorId === meId && p.niche === niche && p.kind !== 'text' && !p.archived)
        .map((p) => ({ ref: { kind: 'post', id: p.id }, title: p.mediaLabel ?? p.caption, sub: 'Your post', image: postPhoto(p), color: p.mediaColor })),
    },
    {
      title: 'Posts you saved',
      items: state.posts
        .filter((p) => state.saves[p.id] && p.niche === niche && p.kind !== 'text' && p.authorId !== meId)
        .map((p) => ({ ref: { kind: 'post', id: p.id }, title: p.mediaLabel ?? p.caption, sub: `by ${usersById[p.authorId]?.username}`, image: postPhoto(p), color: p.mediaColor })),
    },
  ];
  const empty = options.every((g) => !g.items.length);
  const byKey: Record<string, Option> = Object.fromEntries(options.flatMap((g) => g.items).map((o) => [key(o.ref), o]));

  const toggle = (r: FavoriteRef) => {
    if (picked.some((p) => key(p) === key(r))) setPicked(picked.filter((p) => key(p) !== key(r)));
    else if (picked.length < MAX_FAVORITES) setPicked([...picked, r]);
    else toast(`Your ${words.top} is full. Remove one first.`);
  };

  const done = () => {
    actions.setFavorites(meId, niche, picked);
    toast(`${words.top} saved`);
    router.canGoBack() ? router.back() : router.replace('/profile');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.navButton}>
          <Text style={[styles.navText, { color: n.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>{words.top}</Text>
        <Pressable accessibilityRole="button" onPress={done} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: n.accent, fontWeight: '700' }]}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 40 }}>
        <Text style={styles.sub}>
          Pick up to four, in order. They sit at the top of your profile in {n.label}. {picked.length}/{MAX_FAVORITES} chosen.
          {adding ? ' Your post took the last spot. Tap it to remove it, or tap another to swap it out instead, then Done.' : ''}
        </Text>
        {picked.length ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.group}>Your order</Text>
            <ReorderRow
              slots={MAX_FAVORITES}
              itemHeight={(w) => w * 1.25 + 22}
              items={picked.map((r, i) => {
                const o = byKey[key(r)];
                return {
                  key: key(r),
                  label: `${i + 1}. ${o?.title ?? ''}`,
                  render: () => (
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={[styles.thumb, { backgroundColor: o?.color ?? n.field, borderColor: n.accent }]}>
                        {o?.image ? <Image source={o.image} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                        <View style={[styles.num, { backgroundColor: n.accent }]}>
                          <Text style={styles.numText}>{i + 1}</Text>
                        </View>
                      </View>
                      <Text style={styles.cellTitle} numberOfLines={1}>{o?.title ?? ''}</Text>
                    </View>
                  ),
                };
              })}
              onReorder={(keys) => setPicked(keys.map((k) => picked.find((r) => key(r) === k)).filter((r): r is FavoriteRef => !!r))}
              renderEmpty={() => <View style={[styles.thumb, styles.slot, { borderColor: n.line }]} />}
            />
            {picked.length > 1 ? <Text style={styles.hint}>Hold and drag to change the order.</Text> : null}
          </View>
        ) : null}
        {empty ? (
          <Text style={styles.empty}>Nothing to choose yet. Log something with “{words.did}”, post, or save a few {n.label.toLowerCase()} posts first.</Text>
        ) : null}
        {options.map((g) =>
          g.items.length ? (
            <View key={g.title} style={{ gap: 8 }}>
              <Text style={styles.group}>{g.title}</Text>
              <View style={styles.grid}>
                {g.items.map((o) => {
                  const pos = picked.findIndex((p) => key(p) === key(o.ref));
                  const on = pos >= 0;
                  return (
                    <Pressable
                      key={key(o.ref)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${o.title}${on ? `, number ${pos + 1}` : ''}`}
                      onPress={() => toggle(o.ref)}
                      style={styles.cell}>
                      <View style={[styles.thumb, { backgroundColor: o.color ?? n.field }, on ? { borderColor: n.accent } : null]}>
                        {o.image ? <Image source={o.image} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                        {on ? (
                          <View style={[styles.num, { backgroundColor: n.accent }]}>
                            <Text style={styles.numText}>{pos + 1}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cellTitle} numberOfLines={2}>{o.title}</Text>
                      <Text style={styles.cellSub} numberOfLines={1}>{o.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null,
        )}
        {picked.length ? (
          <Pressable accessibilityRole="button" onPress={() => setPicked([])} style={styles.clear}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  empty: { fontSize: 15, lineHeight: 21, color: colors.textMuted, padding: 16, borderRadius: 14, backgroundColor: colors.surface },
  group: { fontSize: 16, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '30.5%', gap: 4 },
  thumb: { aspectRatio: 0.8, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  num: { position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cellTitle: { fontSize: 12, fontWeight: '600', color: colors.text, lineHeight: 15 },
  cellSub: { fontSize: 11, color: colors.textMuted },
  slot: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  hint: { fontSize: 12, color: colors.textMuted },
  clear: { alignSelf: 'center', minHeight: TOUCH, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  clearText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
});
