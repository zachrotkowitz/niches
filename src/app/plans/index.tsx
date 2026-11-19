import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { NicheFilter } from '@/components/niche-filter';
import { PlanCard } from '@/components/plan-card';
import { DisplayText } from '@/components/primitives';
import { Eyebrow } from '@/components/discover-parts';
import { SurfaceProvider, useSurface } from '@/components/surface';
import { canSee, dayOfMonth, isoDay, type Plan } from '@/lib/plans';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH, type NicheId } from '@/lib/theme';

const DAYS_AHEAD = 14;

/** Your plans, invitations, and public plans you can join. */
export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [filter, setFilter] = useState<NicheId[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const meId = state.me?.id;
  const today = isoDay();

  const visible = state.plans
    .filter((p) => canSee(p, meId) && p.date >= today)
    .filter((p) => !filter.length || filter.includes(p.niche))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

  const isMine = (p: Plan) => !!meId && (p.ownerId === meId || p.invitees.includes(meId) || !!p.rsvps[meId]);
  const invitations = visible.filter((p) => meId && p.invitees.includes(meId) && !p.rsvps[meId] && p.ownerId !== meId);
  const mine = visible.filter((p) => isMine(p) && !invitations.includes(p) && (!day || p.date === day));
  const open = visible.filter((p) => !isMine(p) && p.visibility === 'public' && (!day || p.date === day));

  // Next two weeks, with a dot in each niche's color for days that have your plans.
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => isoDay(i));
  const dotsFor = (d: string) => [...new Set(visible.filter((p) => p.date === d && isMine(p)).map((p) => p.niche))];

  return (
    <SurfaceProvider value={ground}>
    <View style={[styles.screen, { backgroundColor: ground.ground }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        {/* Masthead like the other cream pages (founder picked A's list, Nov 19 2026). */}
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={42} color={ground.text}>Plans</DisplayText>
          <Pressable accessibilityRole="button" onPress={() => router.push('/plans/new')} style={({ pressed }) => [styles.newButton, { backgroundColor: ground.text, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
            <PlusIcon size={15} color={ground.ground} strokeWidth={2.4} />
            <Text style={[styles.newText, { color: ground.ground }]}>New plan</Text>
          </Pressable>
        </View>

        {/* The next two weeks as serif numbers; a dot in the niche's color on days with your plans. Tap a day to see only it. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} accessibilityLabel="Next two weeks">
          {days.map((d, i) => {
            const selected = d === day;
            const dots = dotsFor(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${dots.length ? ', has plans' : ''}`}
                onPress={() => setDay(selected ? null : d)}
                style={styles.day}>
                <Text style={[styles.dayName, { color: ground.muted }]}>{i === 0 ? 'TODAY' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</Text>
                <Text style={[styles.dayNum, { color: ground.text, borderBottomColor: selected ? ground.text : 'transparent' }]}>{dayOfMonth(d)}</Text>
                <View style={styles.dots}>
                  {dots.slice(0, 3).map((n) => (
                    <View key={n} style={[styles.dot, { backgroundColor: niches[n].accent }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: 4 }}>
          <NicheFilter value={filter} onChange={setFilter} />
        </View>

        {invitations.length ? (
          <Section title={invitations.length === 1 ? 'One invitation waiting.' : `${invitations.length} invitations waiting.`} big>
            {invitations.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </Section>
        ) : null}

        <Section title={day ? 'Your plans that day' : 'Your plans'}>
          {mine.length ? (
            mine.map((p) => <PlanCard key={p.id} plan={p} />)
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: ground.text }]}>{day ? 'Nothing planned that day.' : 'Nothing planned yet.'}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/plans/new')} style={styles.linkHit}>
                <Text style={[styles.emptyBody, { color: ground.muted }]}>
                  Cook with friends or plan a shoot. <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>Make a plan</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </Section>

        {open.length ? (
          <Section title="Open to join" sub="Public plans from people in your niches.">
            {open.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </View>
    </SurfaceProvider>
  );
}

function Section({ title, sub, big, children }: { title: string; sub?: string; big?: boolean; children: React.ReactNode }) {
  const surface = useSurface();
  return (
    <View style={styles.section}>
      {big ? <Text style={[styles.bigTitle, { color: surface.text }]}>{title}</Text> : <Eyebrow>{title}</Eyebrow>}
      {sub ? <Text style={[styles.sectionSub, { color: surface.muted }]}>{sub}</Text> : null}
      <View style={{ gap: 10, marginTop: 10 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  back: { width: TOUCH, height: TOUCH, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
  masthead: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1 },
  newButton: { minHeight: 40, paddingHorizontal: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newText: { fontSize: 15, fontWeight: '700' },
  days: { gap: 6, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 2 },
  day: { width: 46, minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayName: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  dayNum: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, paddingHorizontal: 2, borderBottomWidth: 2.5 },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  bigTitle: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 30 },
  sectionSub: { fontSize: 13, marginTop: 2 },
  empty: { gap: 2 },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 27 },
  emptyBody: { fontSize: 14, lineHeight: 20 },
  linkHit: { minHeight: 36, justifyContent: 'center' },
});
