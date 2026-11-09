import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFavoriteItem } from '@/components/diary';
import { Avatar, Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { diaryWords, type FavoriteRef } from '@/lib/diary';
import { buildRecap, MONTHS, MONTHS_LONG, recapText, type Recap } from '@/lib/recap';
import { dayLabel } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { BODY_FONTS, fonts, NICHE_ORDER, TOUCH, type Niche, type NicheId } from '@/lib/theme';
import type { User } from '@/lib/types';

type Tone = 'ink' | 'accent' | 'field';
type Page = { id: string; tone: Tone; body: ReactNode };

/** Content rises in, a beat apart. Respects the system's reduce-motion setting. */
const rise = (i: number) => FadeInDown.duration(460).delay(90 + i * 110).reduceMotion(ReduceMotion.System);

/** Counts up from zero once, unless the person prefers reduced motion. */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) return setValue(target);
        const start = Date.now();
        const tick = () => {
          const t = Math.min(1, (Date.now() - start) / 900);
          setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [target]);
  return value;
}

/**
 * Your year in a niche, Wrapped-style. You tap through it at your own pace
 * (no auto-advance), and it's built only from your own diary, goals and posts:
 * no likes, no follower numbers, no comparing yourself to anyone.
 */
export default function RecapScreen() {
  const params = useLocalSearchParams<{ niche: NicheId }>();
  const nicheId: NicheId = NICHE_ORDER.includes(params.niche) ? params.niche : 'cooking';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[nicheId];
  const words = diaryWords(nicheId);
  const meId = state.me?.id ?? '';
  const year = new Date().getFullYear();
  const recap = useMemo(() => buildRecap(state, meId, nicheId, year), [state, meId, nicheId, year]);
  const [index, setIndex] = useState(0);
  const hasSample = state.logs.some((l) => l.sample && l.userId === meId);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const share = async () => {
    const message = recapText(recap, niche.label, words);
    try {
      if (Platform.OS === 'web' && !(globalThis.navigator as Navigator | undefined)?.share) throw new Error('no share sheet');
      await Share.share({ message });
    } catch {
      await Clipboard.setStringAsync(message);
      toast('Copied. Paste it anywhere.');
    }
  };

  if (recap.total < 3) {
    return (
      <View style={[styles.screen, { backgroundColor: niche.field, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <CloseButton onPress={close} color={niche.ink} />
        <View style={styles.emptyWrap}>
          <Text style={[styles.yearHuge, { color: niche.accent }]}>{year}</Text>
          <Text style={[styles.h1, { color: niche.ink }]}>Your year in {niche.label} fills in as you {nicheId === 'cooking' ? 'cook' : 'go'}.</Text>
          <Text style={[styles.body, { color: niche.inkSoft }]}>
            Every “{words.did}” in your diary becomes part of it: your go-to {words.thing}, your five-star {words.things}, your best run of weeks. {recap.total ? `You have ${recap.total} so far.` : ''}
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button label={`${words.did}: log something`} color={niche.accent} onPress={() => router.replace({ pathname: '/log/new', params: { niche: nicheId } })} />
            {nicheId === 'cooking' ? (
              <Button
                label="Demo: fill in a sample year"
                tone="inverse"
                color={niche.ink}
                onPress={() => {
                  actions.addSampleYear(meId);
                  toast('Added a sample year to your diary');
                }}
              />
            ) : null}
          </View>
          {nicheId === 'cooking' ? <Text style={[styles.small, { color: niche.inkSoft }]}>The sample is private, stands in for a year of use, and can be removed in one tap.</Text> : null}
        </View>
      </View>
    );
  }

  const pages = buildPages(recap, niche, words, usersById, state.me?.displayName ?? 'You', state.favorites[meId]?.[nicheId] ?? []);
  const page = pages[Math.min(index, pages.length - 1)];
  const last = index >= pages.length - 1;
  const go = (delta: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, index + delta));
    if (next === index) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    setIndex(next);
  };
  const bg = page.tone === 'ink' ? niche.ink : page.tone === 'accent' ? niche.accent : niche.field;
  const fg = page.tone === 'field' ? niche.ink : '#FFFFFF';

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Tap left to go back, right to go on. Screen readers get real buttons below. */}
      <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1 }} onPress={() => go(-1)} />
          <Pressable style={{ flex: 2 }} onPress={() => go(1)} />
        </View>
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.bars} accessibilityLabel={`Page ${index + 1} of ${pages.length}`}>
          {pages.map((p, i) => (
            <View key={p.id} style={[styles.bar, { backgroundColor: fg, opacity: i <= index ? 0.95 : 0.28 }]} />
          ))}
        </View>
        <View style={styles.topRow} pointerEvents="box-none">
          <Text style={[styles.kicker, { color: fg }]}>
            {year} in {niche.label}
            {recap.ongoing ? ' · so far' : ''}
          </Text>
          <CloseButton onPress={close} color={fg} inline />
        </View>
      </View>

      <View key={page.id} style={[styles.page, { paddingBottom: insets.bottom + (last ? 16 : 84) }]} pointerEvents="box-none">
        {/* Page content ignores touches so taps anywhere reach the tap zones underneath. */}
        <View pointerEvents="none">{page.body}</View>
        {last ? (
          <Animated.View entering={rise(5)} style={{ gap: 8, marginTop: 18 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="Share" color={niche.accent} style={{ flex: 1 }} onPress={share} />
              <Button label="Done" tone="inverse" color={niche.ink} style={{ flex: 1 }} onPress={close} />
            </View>
            <Text style={[styles.small, { color: niche.inkSoft, textAlign: 'center' }]}>Only you can see your recap. Sharing is up to you.</Text>
            {hasSample ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  actions.removeSampleYear();
                  toast('Sample year removed');
                  close();
                }}
                style={styles.removeSample}>
                <Text style={[styles.removeSampleText, { color: niche.inkSoft }]}>Demo: remove the sample year</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>

      {!last ? (
        <View style={[styles.navRow, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
          {index > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Previous" onPress={() => go(-1)} style={[styles.navButton, { borderColor: fg }]}>
              <Text style={[styles.navText, { color: fg }]}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Next" onPress={() => go(1)} style={[styles.navButton, styles.navNext, { backgroundColor: fg }]}>
            <Text style={[styles.navText, { color: bg }]}>{index === 0 ? 'Start' : 'Next'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CloseButton({ onPress, color, inline }: { onPress: () => void; color: string; inline?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Close recap" onPress={onPress} style={[styles.close, inline ? null : { alignSelf: 'flex-end', marginRight: 12 }]}>
      <Text style={[styles.closeText, { color }]}>×</Text>
    </Pressable>
  );
}

function BigNumber({ value, color }: { value: number; color: string }) {
  const shown = useCountUp(value);
  return (
    <Text style={[styles.huge, { color }]} accessibilityLabel={String(value)}>
      {shown}
    </Text>
  );
}

function buildPages(
  r: Recap,
  n: Niche,
  words: ReturnType<typeof diaryWords>,
  usersById: Record<string, User>,
  name: string,
  favorites: FavoriteRef[],
): Page[] {
  const pages: Page[] = [];
  const firstName = name.split(' ')[0];
  const daysSoFar = Math.max(1, Math.round((Date.now() - new Date(r.year, 0, 1).getTime()) / 86400000));
  const every = Math.max(1, Math.round(daysSoFar / r.total));

  pages.push({
    id: 'intro',
    tone: 'ink',
    body: (
      <View style={styles.center}>
        <Animated.Text entering={FadeIn.duration(600).reduceMotion(ReduceMotion.System)} style={[styles.yearHuge, { color: n.field }]}>
          {r.year}
        </Animated.Text>
        <Animated.Text entering={rise(1)} style={[styles.h1, { color: '#FFFFFF' }]}>
          {firstName}, here’s your year in {n.label}.
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={[styles.body, { color: n.field }]}>
          Everything you logged, nothing about likes.
        </Animated.Text>
      </View>
    ),
  });

  pages.push({
    id: 'total',
    tone: 'accent',
    body: (
      <View style={styles.center}>
        <Animated.Text entering={rise(0)} style={[styles.lead, { color: '#FFFFFF' }]}>
          You made
        </Animated.Text>
        <BigNumber value={r.total} color="#FFFFFF" />
        <Animated.Text entering={rise(1)} style={[styles.h1, { color: '#FFFFFF' }]}>
          {words.things}
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={[styles.body, { color: '#FFFFFF' }]}>
          {r.distinct} different ones. That’s about one every {every === 1 ? 'day' : `${every} days`}.
        </Animated.Text>
      </View>
    ),
  });

  const max = Math.max(...r.byMonth, 1);
  pages.push({
    id: 'rhythm',
    tone: 'field',
    body: (
      <View style={styles.stack}>
        <Animated.Text entering={rise(0)} style={[styles.lead, { color: n.inkSoft }]}>
          Your rhythm
        </Animated.Text>
        <Animated.Text entering={rise(1)} style={[styles.h1, { color: n.ink }]}>
          {MONTHS_LONG[r.busiestMonth]} was your busiest month.
        </Animated.Text>
        <Animated.View entering={rise(2)} style={styles.chart} accessibilityLabel={`By month: ${r.byMonth.map((c, i) => `${MONTHS[i]} ${c}`).join(', ')}`}>
          {r.byMonth.map((c, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.barFill, { height: Math.max(4, (c / max) * 150), backgroundColor: i === r.busiestMonth ? n.accent : n.inkSoft, opacity: i === r.busiestMonth ? 1 : 0.45 }]} />
              <Text style={[styles.barLabel, { color: n.inkSoft }]}>{MONTHS[i].charAt(0)}</Text>
            </View>
          ))}
        </Animated.View>
        <Animated.Text entering={rise(3)} style={[styles.body, { color: n.ink }]}>
          You {words.thing === 'dish' ? 'cooked' : 'made something'} in {r.weeksActive} different weeks.{r.longestRun > 1 ? ` Your longest run was ${r.longestRun} weeks in a row.` : ''}
        </Animated.Text>
      </View>
    ),
  });

  if (r.mostMade.length) {
    const [top, ...rest] = r.mostMade;
    pages.push({
      id: 'goto',
      tone: 'ink',
      body: (
        <View style={styles.stack}>
          <Animated.Text entering={rise(0)} style={[styles.lead, { color: n.field }]}>
            Your go-to
          </Animated.Text>
          <Animated.View entering={rise(1)} style={[styles.swatch, { backgroundColor: top.log.mediaColor ?? n.accent }]}>
            {top.log.imageUri ? <Image source={{ uri: top.log.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
          </Animated.View>
          <Animated.Text entering={rise(2)} style={[styles.h0, { color: '#FFFFFF' }]}>
            {top.title}
          </Animated.Text>
          <Animated.Text entering={rise(3)} style={[styles.h2, { color: n.field }]}>
            {top.count} times this year
          </Animated.Text>
          {rest.length ? (
            <Animated.View entering={rise(4)} style={{ gap: 6, marginTop: 8 }}>
              {rest.map((m, i) => (
                <Text key={m.title} style={[styles.body, { color: '#FFFFFF' }]}>
                  {i + 2}. {m.title} <Text style={{ color: n.field }}>· {m.count}×</Text>
                </Text>
              ))}
            </Animated.View>
          ) : null}
        </View>
      ),
    });
  }

  if (r.fiveStars.length) {
    pages.push({
      id: 'stars',
      tone: 'accent',
      body: (
        <View style={styles.stack}>
          <Animated.Text entering={rise(0)} style={[styles.lead, { color: '#FFFFFF' }]}>
            Five stars
          </Animated.Text>
          <Animated.Text entering={rise(1)} style={[styles.h1, { color: '#FFFFFF' }]}>
            {r.fiveStarCount} {r.fiveStarCount === 1 ? words.thing : words.things} you nailed.
          </Animated.Text>
          <Animated.View entering={rise(2)} style={styles.tiles}>
            {r.fiveStars.slice(0, 6).map((l) => (
              <View key={l.id} style={styles.tileWrap}>
                <View style={[styles.tile, { backgroundColor: l.mediaColor ?? n.field }]}>
                  {l.imageUri ? <Image source={{ uri: l.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                </View>
                <Text style={styles.tileTitle} numberOfLines={2}>{l.title}</Text>
              </View>
            ))}
          </Animated.View>
          <Animated.Text entering={rise(3)} style={[styles.body, { color: '#FFFFFF' }]}>
            Your average was {r.avgRating.toFixed(1)} stars.
          </Animated.Text>
        </View>
      ),
    });
  }

  if (r.learnedFrom.length) {
    pages.push({
      id: 'learned',
      tone: 'field',
      body: (
        <View style={styles.stack}>
          <Animated.Text entering={rise(0)} style={[styles.lead, { color: n.inkSoft }]}>
            People you learned from
          </Animated.Text>
          <Animated.Text entering={rise(1)} style={[styles.h1, { color: n.ink }]}>
            You made {r.learnedFrom.reduce((a, b) => a + b.count, 0)} {words.things} from other people’s posts.
          </Animated.Text>
          <View style={{ gap: 12, marginTop: 6 }}>
            {r.learnedFrom.map((f, i) => {
              const u = usersById[f.userId];
              return (
                <Animated.View key={f.userId} entering={rise(2 + i)} style={styles.person}>
                  <Avatar user={u} size={48} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.personName, { color: n.ink }]}>{u?.displayName}</Text>
                    <Text style={[styles.personSub, { color: n.inkSoft }]}>
                      {u?.username} · {f.count} of their {f.count === 1 ? 'recipe' : 'recipes'}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>
      ),
    });
  }

  if (r.goals.length) {
    pages.push({
      id: 'goals',
      tone: 'ink',
      body: (
        <View style={styles.stack}>
          <Animated.Text entering={rise(0)} style={[styles.lead, { color: n.field }]}>
            Goals
          </Animated.Text>
          <Animated.Text entering={rise(1)} style={[styles.h1, { color: '#FFFFFF' }]}>
            {r.goals.filter((g) => g.done).length ? `You finished ${r.goals.filter((g) => g.done).length} and kept going on the rest.` : 'You kept showing up.'}
          </Animated.Text>
          <View style={{ gap: 10, marginTop: 6 }}>
            {r.goals.slice(0, 3).map((g, i) => (
              <Animated.View key={g.goal.id} entering={rise(2 + i)} style={[styles.goalRow, { borderColor: n.field }]}>
                <Text style={styles.goalTitle}>{g.goal.title}</Text>
                <Text style={[styles.goalSub, { color: n.field }]}>
                  {g.done ? 'Done' : `${g.checkIns} check-ins`}
                  {g.goal.kind === 'habit' && g.longest > 1 ? ` · best streak ${g.longest} weeks` : ''}
                  {g.goal.restWeeks.length ? ` · ${g.goal.restWeeks.length} rest weeks` : ''}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      ),
    });
  }

  if (r.notes.length) {
    const note = r.notes[0];
    pages.push({
      id: 'notes',
      tone: 'accent',
      body: (
        <View style={styles.stack}>
          <Animated.Text entering={rise(0)} style={[styles.lead, { color: '#FFFFFF' }]}>
            Best note to self
          </Animated.Text>
          <Animated.Text entering={rise(1)} style={[styles.quote, { color: '#FFFFFF' }]}>
            “{note.text}”
          </Animated.Text>
          <Animated.Text entering={rise(2)} style={[styles.body, { color: '#FFFFFF' }]}>
            {note.log.title}, {dayLabel(note.log.date)}
          </Animated.Text>
        </View>
      ),
    });
  }

  pages.push({
    id: 'summary',
    tone: 'field',
    body: <Summary r={r} n={n} words={words} name={name} favorites={favorites} />,
  });

  return pages;
}

/** The one-card version, made to be screenshotted or shared. */
function Summary({ r, n, words, name, favorites }: { r: Recap; n: Niche; words: ReturnType<typeof diaryWords>; name: string; favorites: FavoriteRef[] }) {
  const stats = [
    { value: String(r.total), label: `${words.things} made` },
    { value: String(r.weeksActive), label: 'weeks active' },
    { value: r.longestRun > 1 ? `${r.longestRun} wk` : '–', label: 'longest run' },
    { value: String(r.fiveStarCount), label: 'five-star' },
  ];
  return (
    <Animated.View entering={rise(0)} style={[styles.card, { backgroundColor: n.ink }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.cardYear, { color: n.field }]}>{r.year}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
          <Text style={[styles.cardSub, { color: n.field }]}>
            in {n.label}
            {r.ongoing ? ', so far' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.statGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCell, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: n.field }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      {r.mostMade[0] ? (
        <Text style={[styles.cardLine, { color: n.field }]}>
          Go-to <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{r.mostMade[0].title}</Text>
        </Text>
      ) : null}
      {favorites.length ? (
        <View style={{ gap: 6 }}>
          <Text style={[styles.cardLabel, { color: n.field }]}>{words.top}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {favorites.slice(0, 4).map((f) => (
              <FavoriteSwatch key={`${f.kind}-${f.id}`} refItem={f} fallback={n.accent} />
            ))}
          </View>
        </View>
      ) : null}
      <Text style={[styles.cardFoot, { color: n.field }]}>Niches</Text>
    </Animated.View>
  );
}

function FavoriteSwatch({ refItem, fallback }: { refItem: FavoriteRef; fallback: string }) {
  const item = useFavoriteItem(refItem);
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={[styles.favTile, { backgroundColor: item?.color ?? fallback }]}>
        {item?.imageUri ? <Image source={{ uri: item.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <Text style={styles.favTitle} numberOfLines={1}>{item?.title ?? ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, gap: 6, zIndex: 2 },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  close: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 30, lineHeight: 32, fontWeight: '300' },
  page: { flex: 1, paddingHorizontal: 28, paddingTop: 110, justifyContent: 'center' },
  center: { gap: 10 },
  stack: { gap: 12 },
  yearHuge: { fontFamily: fonts.displayItalic, fontSize: 120, lineHeight: 120, letterSpacing: -4 },
  huge: { fontFamily: fonts.display, fontSize: 160, lineHeight: 160, letterSpacing: -5, fontVariant: ['tabular-nums'] },
  lead: { fontFamily: BODY_FONTS['800'], fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
  h0: { fontFamily: fonts.displayItalic, fontSize: 52, lineHeight: 54, letterSpacing: -1 },
  h1: { fontFamily: fonts.display, fontSize: 36, lineHeight: 39, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  body: { fontFamily: BODY_FONTS['400'], fontSize: 17, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 18 },
  quote: { fontFamily: fonts.displayItalic, fontSize: 38, lineHeight: 43, letterSpacing: -0.5 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 176, marginVertical: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, fontWeight: '700' },
  swatch: { width: 120, height: 120, borderRadius: 24, overflow: 'hidden', marginVertical: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 6 },
  tileWrap: { width: '30%', gap: 4 },
  tile: { aspectRatio: 0.85, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  tileTitle: { fontSize: 12, lineHeight: 15, fontWeight: '700', color: '#FFFFFF' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personName: { fontSize: 18, fontWeight: '800' },
  personSub: { fontSize: 14 },
  goalRow: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4, gap: 2 },
  goalTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  goalSub: { fontSize: 14 },
  navRow: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  navButton: { minHeight: TOUCH + 4, minWidth: 96, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  navNext: { borderWidth: 0, minWidth: 120 },
  navText: { fontSize: 16, fontWeight: '800' },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  card: { borderRadius: 28, padding: 20, gap: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardYear: { fontFamily: fonts.display, fontSize: 44, letterSpacing: -2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  cardSub: { fontSize: 14, fontWeight: '600' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: { width: '48%', flexGrow: 1, borderRadius: 16, padding: 12 },
  statValue: { fontFamily: fonts.display, fontSize: 30, color: '#FFFFFF', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, fontWeight: '600' },
  cardLine: { fontSize: 15 },
  cardLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  favTile: { aspectRatio: 0.85, borderRadius: 10, overflow: 'hidden' },
  favTitle: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  cardFoot: { fontFamily: fonts.display, fontSize: 15, letterSpacing: -0.3, textAlign: 'right' },
  removeSample: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  removeSampleText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
