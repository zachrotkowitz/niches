import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalCard } from '@/components/goals';
import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { UnderlineTabs } from '@/components/underline-tabs';
import { progress } from '@/lib/goals';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH } from '@/lib/theme';

/**
 * All your goals (option B, founder Nov 18 2026): ring cards on the cream
 * background, quiet tabs for each niche you have goals in and for Done.
 */
export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [tab, setTab] = useState<string>('all');
  const mine = state.goals.filter((g) => g.userId === state.me?.id).sort((a, b) => b.createdAt - a.createdAt);
  const active = mine.filter((g) => !g.doneAt);
  const done = mine.filter((g) => g.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const nicheTabs = NICHE_ORDER.filter((id) => active.some((g) => g.niche === id));
  const shown = tab === 'done' ? done : tab === 'all' ? active : active.filter((g) => g.niche === tab);
  const left = active.filter((g) => g.kind === 'habit' && (g.period ?? 'week') === 'week' && progress(g).fraction < 1).length;

  return (
    <SurfaceProvider value={ground}>
      <ScrollView style={{ flex: 1, backgroundColor: ground.ground }} contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.back}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={42} color={ground.text}>Goals</DisplayText>
          <Pressable accessibilityRole="button" onPress={() => router.push('/goals/new')} style={styles.newLink}>
            <PlusIcon size={15} color={ground.text} strokeWidth={2.4} />
            <Text style={[styles.newText, { color: ground.text }]}>New goal</Text>
          </Pressable>
        </View>

        {mine.length ? (
          <>
            <View style={{ marginTop: 6 }}>
              <UnderlineTabs
                label="Filter goals"
                inset={10}
                value={tab}
                onChange={setTab}
                items={[
                  { key: 'all', label: 'All' },
                  ...(nicheTabs.length > 1 ? nicheTabs.map((id) => ({ key: id, label: niches[id].label, color: niches[id].accent })) : []),
                  ...(done.length ? [{ key: 'done', label: `Done · ${done.length}` }] : []),
                ]}
              />
            </View>
            {tab === 'all' && active.some((g) => g.kind === 'habit' && (g.period ?? 'week') === 'week') ? (
              <Text style={[styles.line, { color: ground.text }]}>{left === 0 ? 'Every weekly goal done this week.' : `${left === 1 ? 'One' : left} to do this week.`}</Text>
            ) : null}
            <View style={styles.list}>
              {shown.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
              {shown.length === 0 ? <Text style={[styles.empty, { color: ground.muted }]}>{tab === 'done' ? 'Nothing finished yet.' : 'No goals here.'}</Text> : null}
            </View>
          </>
        ) : (
          <View style={styles.firstWrap}>
            <Text style={[styles.firstTitle, { color: ground.text }]}>Pick something to get better at.</Text>
            <Text style={[styles.firstBody, { color: ground.body }]}>Streaks are weekly, not daily, and a rest week never breaks one. Goals are private unless you put them on your profile.</Text>
            <Button label="Set your first goal" color={ground.text} onPress={() => router.push('/goals/new')} />
          </View>
        )}
      </ScrollView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  back: { width: TOUCH, height: TOUCH, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
  masthead: { marginHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  newLink: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: TOUCH },
  newText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  line: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 26, marginHorizontal: 20, marginTop: 14 },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 20 },
  firstWrap: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  firstTitle: { fontFamily: fonts.displayItalic, fontSize: 28, lineHeight: 31 },
  firstBody: { fontSize: 15, lineHeight: 21 },
});
