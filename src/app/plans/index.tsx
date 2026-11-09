import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { NicheFilter } from '@/components/niche-filter';
import { PlanCard } from '@/components/plan-card';
import { Button, DisplayText } from '@/components/primitives';
import { canSee, dayOfMonth, isoDay, type Plan } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH, type NicheId } from '@/lib/theme';

const DAYS_AHEAD = 14;

/** Your plans, invitations, and public plans you can join. */
export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const niches = useNiches();
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
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/plans/new')} style={({ pressed }) => [styles.newButton, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <PlusIcon size={16} />
          <Text style={styles.newText}>New plan</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.head}>
          <DisplayText>Plans</DisplayText>
          <Text style={styles.sub}>Meals to cook, dinners with friends, and outings to shoot or sketch.</Text>
        </View>

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
                style={[styles.day, selected ? styles.daySelected : null]}>
                <Text style={[styles.dayName, selected ? { color: '#FFFFFF' } : null]}>{i === 0 ? 'Today' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                <Text style={[styles.dayNum, selected ? { color: '#FFFFFF' } : null]}>{dayOfMonth(d)}</Text>
                <View style={styles.dots}>
                  {dots.slice(0, 3).map((n) => (
                    <View key={n} style={[styles.dot, { backgroundColor: selected ? '#FFFFFF' : niches[n].accent }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: 8 }}>
          <NicheFilter value={filter} onChange={setFilter} />
        </View>

        {invitations.length ? (
          <Section title={`Invitations · ${invitations.length}`}>
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
              <Text style={styles.emptyTitle}>{day ? 'Nothing planned that day' : 'Nothing planned yet'}</Text>
              <Text style={styles.emptyBody}>Schedule a meal, invite friends to cook together, or plan a shoot.</Text>
              <Button label="Make a plan" color={niches[state.niche].accent} onPress={() => router.push('/plans/new')} />
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
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      <View style={{ gap: 10, marginTop: 10 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingRight: 16 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  newButton: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  head: { paddingHorizontal: 20, gap: 6 },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  days: { gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  day: { width: 54, minHeight: 72, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  daySelected: { backgroundColor: colors.text },
  dayName: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  empty: { padding: 18, borderRadius: 18, backgroundColor: colors.surface, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 4 },
});
