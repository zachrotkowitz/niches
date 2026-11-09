import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalCard } from '@/components/goals';
import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { progress } from '@/lib/goals';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

/** Your goals: what you're working on this week, and what you've finished. */
export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const niches = useNiches();
  const meId = state.me?.id;
  const mine = state.goals.filter((g) => g.userId === meId).sort((a, b) => b.createdAt - a.createdAt);
  const active = mine.filter((g) => !g.doneAt);
  const done = mine.filter((g) => g.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const habits = active.filter((g) => g.kind === 'habit');
  const hitThisWeek = habits.filter((g) => progress(g).fraction >= 1).length;
  const niche = niches[state.niche];

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/goals/new')} style={({ pressed }) => [styles.newButton, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <PlusIcon size={16} />
          <Text style={styles.newText}>New goal</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.head}>
          <DisplayText>Goals</DisplayText>
          <Text style={styles.sub}>
            {habits.length
              ? `This week: ${hitThisWeek} of ${habits.length} weekly ${habits.length === 1 ? 'goal' : 'goals'} done.`
              : 'Pick something to get better at. Check in when you do it.'}
          </Text>
        </View>

        {active.length ? (
          <Section title="Working on">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </Section>
        ) : (
          <View style={[styles.empty, { backgroundColor: niche.field }]}>
            <Text style={[styles.emptyTitle, { color: niche.ink }]}>No goals yet</Text>
            <Text style={[styles.emptyBody, { color: niche.inkSoft }]}>
              Streaks here are weekly, not daily, and a rest week never breaks one. Goals are private unless you put them on your profile.
            </Text>
            <Button label="Set your first goal" color={niche.accent} onPress={() => router.push('/goals/new')} />
          </View>
        )}

        {done.length ? (
          <Section title={`Done · ${done.length}`}>
            {done.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </Section>
        ) : null}

        <Text style={styles.footnote}>No reminders that guilt you, no leaderboards. Only you see your numbers unless you choose otherwise.</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  empty: { margin: 20, padding: 20, borderRadius: 20, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 15, lineHeight: 21 },
  footnote: { fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32, marginTop: 28 },
});
