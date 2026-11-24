import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { Eyebrow } from '@/components/discover-parts';
import { GoalRing, ringLabel } from '@/components/goals';
import { CheckIcon, ChevronLeftIcon, LockIcon, MoreIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { SurfaceProvider } from '@/components/surface';
import { useToast, type ToastAction } from '@/components/toast';
import { diaryWords } from '@/lib/diary';
import { currentBest, fmt, goalRule, periodOf, progress, streak, weekDone, weekKey, weekNumber, type Goal } from '@/lib/goals';
import { logPhoto, postPhoto } from '@/lib/demo-photos';
import { shortTitle } from '@/lib/format';
import { dayLabel, isoDay } from '@/lib/plans';
import { isVisible, useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, PLAIN_SURFACE, TOUCH, type Surface } from '@/lib/theme';

type Moment = { key: string; date: string; title: string; sub: string; photo?: ReturnType<typeof logPhoto>; milestone?: string; open?: () => void; checkInId?: string; rest?: boolean };

/**
 * One goal (founder, Nov 18 2026): option C's page without the day grid, on
 * the cream background. Name, a small ring with where you are, check-in
 * buttons, then your progress as a timeline: photos from diary entries and
 * progress posts, rest weeks, and milestones (streaks, halfway, new bests).
 * Settings live in the ⋯ menu.
 */
export default function GoalScreen() {
  const { id, checkin } = useLocalSearchParams<{ id: string; checkin?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [checkingIn, setCheckingIn] = useState(checkin === '1');
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);

  const goal = state.goals.find((g) => g.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/goals'));
  const isMine = !!goal && goal.userId === state.me?.id;

  if (!goal || (!isMine && goal.visibility !== 'profile')) {
    return (
      <View style={{ flex: 1, backgroundColor: ground.ground, paddingTop: insets.top + 60, padding: 20, gap: 16 }}>
        <Text style={{ fontSize: 17, color: ground.text }}>This goal isn’t available.</Text>
        <Button label="Back" color={ground.text} onPress={goBack} />
      </View>
    );
  }

  const niche = niches[goal.niche];

  // Messages about this niche come in its dark color (founder, Nov 24 2026).

  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const owner = usersById[goal.userId];
  const p = progress(goal);
  const s = goal.kind === 'habit' ? streak(goal) : 0;
  const hidden = !isMine && !!goal.hideNumbers;
  const done = !!goal.doneAt;
  const thisWeek = weekKey(isoDay());
  const resting = goal.restWeeks.includes(thisWeek);
  const words = diaryWords(goal.niche);
  const label = ringLabel(goal);

  // The timeline, oldest first while we work out milestones, then newest on top.
  const moments: Moment[] = [];
  const asc = [...goal.checkIns].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  let running = 0;
  let bestSoFar: number | undefined;
  const marked = new Set<string>();
  asc.forEach((c, i) => {
    const log = c.logId ? state.logs.find((l) => l.id === c.logId) : undefined;
    const post = c.postId ? state.posts.find((x) => x.id === c.postId) : undefined;
    const logOk = !!log && (isMine || log.visibility === 'profile');
    const postOk = !!post && (isMine ? !post.archived : isVisible(state, post));
    if (!isMine && !logOk && !postOk) return;
    let milestone: string | undefined = i === 0 ? 'Started' : undefined;
    if (goal.kind === 'habit') {
      const st = streak(goal, c.date);
      for (const m of [4, 8, 12, 26, 52]) if (st === m && !marked.has(`s${m}`)) (marked.add(`s${m}`), (milestone = `${m}-${periodOf(goal)} streak`));
    } else if (goal.kind === 'total') {
      const before = running;
      running += c.value ?? 1;
      const t = goal.target ?? 0;
      if (t && before < t && running >= t) milestone = 'Goal reached';
      else if (t && before < t / 2 && running >= t / 2) milestone = 'Halfway there';
    } else if (typeof c.value === 'number') {
      const better = bestSoFar === undefined ? false : goal.direction === 'down' ? c.value < bestSoFar : c.value > bestSoFar;
      if (better) milestone = 'New personal best';
      if (goal.target !== undefined && (goal.direction === 'down' ? c.value <= goal.target : c.value >= goal.target) && !marked.has('t')) (marked.add('t'), (milestone = 'Goal reached'));
      bestSoFar = bestSoFar === undefined ? c.value : goal.direction === 'down' ? Math.min(bestSoFar, c.value) : Math.max(bestSoFar, c.value);
    }
    const amount = goal.kind === 'best' && c.value !== undefined ? `${fmt(c.value)} ${goal.unit ?? ''}`.trim() : goal.kind === 'total' && (c.value ?? 1) !== 1 ? `+${fmt(c.value!)}` : '';
    moments.push({
      key: c.id,
      date: c.date,
      title: logOk ? log!.title : postOk ? post!.mediaLabel ?? shortTitle(post!.caption) : c.note ?? (goal.kind === 'best' && amount ? amount : 'Checked in'),
      sub: [`Week ${weekNumber(goal, c.date)}`, dayLabel(c.date), logOk ? 'diary' : postOk ? 'progress post' : '', amount && (logOk || postOk) ? amount : ''].filter(Boolean).join(' · '),
      photo: logOk ? logPhoto(log!) : postOk ? postPhoto(post!) : undefined,
      milestone: hidden && milestone !== 'Started' ? undefined : milestone,
      open: logOk ? () => router.push({ pathname: '/log/[id]', params: { id: log!.id } }) : postOk ? () => router.push({ pathname: '/post/[id]', params: { id: post!.id } }) : undefined,
      checkInId: isMine ? c.id : undefined,
    });
  });
  if (goal.kind === 'habit') for (const w of goal.restWeeks) moments.push({ key: `rest-${w}`, date: w, title: 'Rest week', sub: `Week ${weekNumber(goal, w)} · streak kept`, rest: true });
  moments.sort((a, b) => b.date.localeCompare(a.date));

  const quick = () => {
    if (goal.kind === 'best') return setCheckingIn(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cid = actions.checkIn(goal.id, { date: isoDay() });
    toast(goal.kind === 'total' ? `+1 ${goal.unit ?? ''}`.trim() : `Checked in for this ${periodOf(goal)}`, { label: 'Undo', onPress: () => actions.removeCheckIn(goal.id, cid) });
  };

  const confirmDelete = () => {
    const run = () => {
      actions.deleteGoal(goal.id);
      toast('Goal deleted');
      goBack();
    };
    const message = 'Deletes the goal and its check-ins. Your diary entries and progress posts stay.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) run();
      return;
    }
    Alert.alert('Delete this goal?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <SurfaceProvider value={ground}>
    <View style={{ flex: 1, backgroundColor: ground.ground }}>
      <View style={[ds.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={ds.icon}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        {isMine ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Goal options" onPress={() => setMenu(true)} style={ds.icon}>
            <MoreIcon color={ground.text} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={ds.eyebrowRow}>
          <Eyebrow>{`${niche.label} goal · ${goalRule(goal)}`}</Eyebrow>
          {isMine && goal.visibility === 'private' ? <LockIcon size={12} color={ground.muted} /> : null}
          {!isMine ? <Text style={[ds.by, { color: ground.muted }]}>· {owner?.username}</Text> : null}
        </View>
        <DisplayText size={44} color={ground.text} style={{ marginTop: 6 }}>{goal.title}</DisplayText>

        <View style={ds.summary}>
          <GoalRing fraction={done ? 1 : hidden ? 0 : p.fraction} color={niche.accent} size={84} stroke={9}>
            {done || weekDone(goal).done ? <CheckIcon size={28} color={niche.accent} strokeWidth={2.6} /> : hidden ? null : <Text style={[ds.ringText, { color: ground.text, fontSize: label.length > 3 ? 19 : 24 }]}>{label}</Text>}
          </GoalRing>
          <View style={{ flex: 1, gap: 2 }}>
            {done ? (
              <Text style={[ds.headline, { color: ground.text }]}>Done</Text>
            ) : hidden ? (
              <Text style={[ds.caption, { color: ground.muted }]}>{owner?.username} keeps the numbers private.</Text>
            ) : (
              // Says something the ring doesn't: your streak, how many to go, or the target.
              <>
                <Text style={[ds.headline, { color: ground.text }]}>{summaryTitle(goal, s)}</Text>
                <Text style={[ds.caption, { color: ground.muted }]}>{summaryLine(goal, s)}</Text>
              </>
            )}
          </View>
        </View>

        {isMine && !done && p.reached ? (
          <View style={[ds.reached, { borderColor: ground.line }]}>
            <Text style={[ds.reachedTitle, { color: ground.text }]}>You reached your target.</Text>
            <View style={{ flexDirection: 'row', gap: 22 }}>
              <Pressable accessibilityRole="button" onPress={() => { actions.setGoalDone(goal.id, true); toast('Goal done. Nice work.'); }} style={ds.link}>
                <Text style={[ds.linkText, { color: ground.text }]}>Mark as done</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={ds.link}>
                <Text style={[ds.linkText, { color: ground.text }]}>Raise it</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isMine && !done ? (
          <View style={{ gap: 4, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={quick} style={({ pressed }) => [ds.primary, { backgroundColor: ground.text, opacity: pressed ? 0.85 : 1 }]}>
                <CheckIcon size={16} color={ground.ground} strokeWidth={2.6} />
                <Text style={[ds.primaryText, { color: ground.ground }]}>{goal.kind === 'habit' ? `Check in this ${periodOf(goal)}` : goal.kind === 'total' ? `Add one${goal.unit ? ` (${goal.unit})` : ''}` : 'Log a new result'}</Text>
              </Pressable>
              {/* Rest is a weekly thing; a month or year already has room for a break. */}
              {goal.kind === 'habit' && periodOf(goal) === 'week' ? (
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: resting }}
                  onPress={() => {
                    actions.toggleRestWeek(goal.id, thisWeek);
                    toast(resting ? 'Rest week removed' : 'Rest week. Your streak is safe.');
                  }}
                  style={[ds.secondary, { borderColor: ground.text, backgroundColor: resting ? '#FFFFFF' : 'transparent' }]}>
                  <Text style={[ds.secondaryText, { color: ground.text }]}>{resting ? 'Resting' : 'Rest'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 22 }}>
              {goal.kind !== 'best' ? (
                <Pressable accessibilityRole="button" onPress={() => setCheckingIn(true)} style={ds.link}>
                  <Text style={[ds.linkText, { color: ground.text }]}>Another day or a note</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/log/new', params: { niche: goal.niche, goalId: goal.id } })} style={ds.link}>
                <Text style={[ds.linkText, { color: ground.text }]}>{words.did}</Text>
              </Pressable>
              {niche.open ? (
                <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/create', params: { goalId: goal.id } })} style={ds.link}>
                  <Text style={[ds.linkText, { color: ground.text }]}>Progress post</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={[ds.timelineHead, { borderTopColor: ground.line }]}>
          <Eyebrow>{isMine ? 'Your progress' : 'Progress'}</Eyebrow>
        </View>
        {moments.length === 0 ? (
          <Text style={[ds.empty, { color: ground.muted }]}>
            {isMine ? `Nothing yet. Check in, log it with “${words.did}”, or share a progress post, and it shows up here with its photo.` : 'Nothing shared yet.'}
          </Text>
        ) : (
          moments.map((m, i) => {
            const plain = !m.photo && !m.milestone;
            return (
            <View key={m.key} style={ds.moment}>
              <View style={ds.rail}>
                <View style={[ds.dot, m.rest ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: niche.accent } : { backgroundColor: niche.accent }]} />
                {i < moments.length - 1 ? <View style={[ds.line, { backgroundColor: niche.line }]} /> : null}
              </View>
              {plain ? (
                // A check-in with no photo is one quiet line, so the photos stand out.
                <View style={ds.plainRow}>
                  <Pressable accessibilityRole={m.open ? 'link' : 'text'} disabled={!m.open} onPress={m.open} style={{ flex: 1, gap: 1 }}>
                    <Text style={[ds.plainTitle, { color: ground.text }]} numberOfLines={1}>{m.title}</Text>
                    <Text style={[ds.plainSub, { color: ground.muted }]}>{m.sub}</Text>
                  </Pressable>
                  {m.checkInId || (m.rest && isMine) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={m.rest ? 'Undo rest week' : `Remove check-in: ${m.title}`}
                      onPress={() => (m.rest ? actions.toggleRestWeek(goal.id, m.date) : (actions.removeCheckIn(goal.id, m.checkInId!), toast('Check-in removed')))}
                      style={ds.x}>
                      <Text style={[ds.xText, { color: ground.muted }]}>×</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
              <View style={{ flex: 1, gap: 6, paddingBottom: 20 }}>
                <Text style={[ds.momentSub, { color: ground.muted }]}>{m.sub.toUpperCase()}</Text>
                <Pressable accessibilityRole={m.open ? 'link' : 'text'} disabled={!m.open} onPress={m.open}>
                  <Text style={[ds.momentTitle, { color: ground.text }]}>{m.title}</Text>
                </Pressable>
                {m.milestone ? <Text style={[ds.milestone, { color: niche.accent }]}>★ {m.milestone.toUpperCase()}</Text> : null}
                {m.photo ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${m.title}`} onPress={m.open} style={[ds.photo, { backgroundColor: niche.field }]}>
                    <Image source={m.photo} contentFit="cover" style={StyleSheet.absoluteFill} />
                  </Pressable>
                ) : null}
                {m.checkInId ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove check-in: ${m.title}`} onPress={() => { actions.removeCheckIn(goal.id, m.checkInId!); toast('Check-in removed'); }} style={ds.remove}>
                    <Text style={[ds.removeText, { color: ground.muted }]}>Remove</Text>
                  </Pressable>
                ) : m.rest && isMine ? (
                  <Pressable accessibilityRole="button" onPress={() => actions.toggleRestWeek(goal.id, m.date)} style={ds.remove}>
                    <Text style={[ds.removeText, { color: ground.muted }]}>Undo rest week</Text>
                  </Pressable>
                ) : null}
              </View>
              )}
            </View>
            );
          })
        )}
      </ScrollView>

      {isMine ? (
        <Sheet
          visible={menu}
          onClose={() => setMenu(false)}
          items={[
            { label: 'Edit goal', onPress: () => (setMenu(false), setEditing(true)) },
            goal.visibility === 'private'
              ? { label: 'Make public', detail: 'Shows on your profile’s Goals tab.', onPress: () => (setMenu(false), actions.updateGoal(goal.id, { visibility: 'profile' }), toast('Now on your profile')) }
              : { label: 'Make private', detail: 'Only you will see it.', onPress: () => (setMenu(false), actions.updateGoal(goal.id, { visibility: 'private' }), toast('Goal is private')) },
            ...(goal.visibility === 'profile'
              ? [{ label: goal.hideNumbers ? 'Show my numbers' : 'Hide my numbers', detail: goal.hideNumbers ? 'Others will see your progress.' : 'Others see the goal and photos, not the numbers.', onPress: () => (setMenu(false), actions.updateGoal(goal.id, { hideNumbers: !goal.hideNumbers })) }]
              : []),
            { label: done ? 'Reopen goal' : 'Mark as done', onPress: () => (setMenu(false), actions.setGoalDone(goal.id, !done), toast(done ? 'Goal reopened' : 'Goal done. Nice work.')) },
            { label: 'Delete goal', destructive: true, onPress: () => (setMenu(false), confirmDelete()) },
          ]}
        />
      ) : null}
      {isMine ? <CheckInSheet goal={goal} visible={checkingIn} onClose={() => setCheckingIn(false)} /> : null}
      {isMine ? <EditSheet goal={goal} visible={editing} onClose={() => setEditing(false)} /> : null}
    </View>
    </SurfaceProvider>
  );
}

/** The big line next to the ring: what the ring doesn't already say. */
function summaryTitle(goal: Goal, s: number) {
  const p = progress(goal);
  if (goal.kind === 'habit') return p.headline === 'Rest week' ? 'Rest week' : s > 0 ? `${s}-${periodOf(goal)} streak` : `This ${periodOf(goal)}`;
  if (goal.kind === 'total') {
    const total = goal.checkIns.reduce((n, c) => n + (c.value ?? 1), 0);
    const left = Math.max(0, (goal.target ?? 0) - total);
    return left === 0 ? 'Target reached' : `${fmt(left)} to go`;
  }
  return `Goal ${fmt(goal.target ?? 0)} ${goal.unit ?? ''}`.trim();
}
function summaryLine(goal: Goal, streakNow = 0) {
  const p = progress(goal);
  if (goal.kind === 'habit') {
    const w = weekDone(goal);
    if (w.done) return w.extra ? `You beat your goal this ${periodOf(goal)}` : `Done this ${periodOf(goal)}`;
    return p.headline === 'Rest week' ? 'Your streak is safe' : streakNow > 0 ? `${p.headline} this ${periodOf(goal)}` : `${p.headline} so far`;
  }
  if (goal.kind === 'total') return `${p.headline.replace(' / ', ' of ')} ${goal.unit ?? ''}`.trim();
  return currentBest(goal) === undefined ? 'No result logged yet' : `Best so far ${p.headline}`;
}

const ds = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  icon: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  by: { fontSize: 12 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  ringText: { fontFamily: fonts.display, fontVariant: ['tabular-nums'] },
  headline: { fontFamily: fonts.display, fontSize: 32, lineHeight: 35, fontVariant: ['tabular-nums'] },
  caption: { fontSize: 14, lineHeight: 19 },
  reached: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderBottomWidth: StyleSheet.hairlineWidth * 2, paddingVertical: 10, marginBottom: 10 },
  reachedTitle: { fontFamily: fonts.displayItalic, fontSize: 22 },
  primary: { flex: 1, minHeight: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryText: { fontSize: 15, fontWeight: '700' },
  secondary: { minHeight: 50, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  link: { minHeight: TOUCH, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  timelineHead: { borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 16, marginTop: 10, marginBottom: 12 },
  empty: { fontSize: 14, lineHeight: 20 },
  moment: { flexDirection: 'row', gap: 14 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  line: { flex: 1, width: 2, marginTop: 4 },
  momentSub: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  momentTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 25 },
  milestone: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  photo: { height: 170, borderRadius: 16, overflow: 'hidden' },
  plainRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 14, marginTop: -2 },
  plainTitle: { fontSize: 15, fontWeight: '700' },
  plainSub: { fontSize: 12 },
  x: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  xText: { fontSize: 20 },
  remove: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  removeText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});

/** Check in: when, plus the number for totals and personal bests, plus an optional note. */
function CheckInSheet({ goal, visible, onClose }: { goal: Goal; visible: boolean; onClose: () => void }) {
  const styles = plainStyles;
  const { actions } = useStore();
  const showToast = useToast();
  const niche = useNiches()[goal.niche];
  // Messages about this niche come in its dark color (founder, Nov 24 2026).
  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const [date, setDate] = useState(isoDay());
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const n = parseFloat(value.replace(',', '.'));
  const needsValue = goal.kind === 'best';
  const ready = !needsValue || Number.isFinite(n);
  const days = Array.from({ length: 7 }, (_, i) => isoDay(-i));

  const save = () => {
    if (!ready) return;
    const prev = currentBest(goal);
    actions.checkIn(goal.id, {
      date,
      value: goal.kind === 'habit' ? undefined : Number.isFinite(n) ? n : undefined,
      note: note.trim() || undefined,
    });
    const isBest = goal.kind === 'best' && Number.isFinite(n) && prev !== undefined && (goal.direction === 'down' ? n < prev : n > prev);
    toast(isBest ? 'New personal best' : 'Checked in');
    setValue('');
    setNote('');
    setDate(isoDay());
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Check in: ${goal.title}`}>
      <View style={{ gap: 14, paddingHorizontal: 4, paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d, i) => {
            const on = d === date;
            return (
              <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDate(d)} style={[styles.day, on ? { backgroundColor: niche.accent } : null]}>
                <Text style={[styles.dayText, on ? { color: '#FFFFFF' } : null]}>
                  {i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {goal.kind !== 'habit' ? (
          <TextInput
            accessibilityLabel={goal.kind === 'best' ? `What did you hit, in ${goal.unit}` : 'How many'}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder={goal.kind === 'best' ? `What did you hit? (${goal.unit})` : `How many ${goal.unit ?? ''}? (1 if blank)`}
            placeholderTextColor="#6B7178"
            style={styles.input}
            selectionColor={niche.accent}
          />
        ) : null}
        <TextInput accessibilityLabel="Note" value={note} onChangeText={setNote} maxLength={140} placeholder="Note to self (optional)" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
        <Button label="Save check-in" color={niche.accent} disabled={!ready} onPress={save} />
      </View>
    </Sheet>
  );
}

/** Rename, change the weekly number, or raise the target. */
function EditSheet({ goal, visible, onClose }: { goal: Goal; visible: boolean; onClose: () => void }) {
  const styles = plainStyles;
  const { actions } = useStore();
  const showToast = useToast();
  const niche = useNiches()[goal.niche];
  // Messages about this niche come in its dark color (founder, Nov 24 2026).
  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const [title, setTitle] = useState(goal.title);
  const [perWeek, setPerWeek] = useState(goal.perWeek ?? 1);
  const [target, setTarget] = useState(goal.target !== undefined ? String(goal.target) : '');
  const t = parseFloat(target.replace(',', '.'));

  const save = () => {
    actions.updateGoal(goal.id, {
      title: title.trim() || goal.title,
      perWeek: goal.kind === 'habit' ? perWeek : undefined,
      target: goal.kind !== 'habit' && Number.isFinite(t) && t > 0 ? t : goal.target,
    });
    toast('Goal updated');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Edit goal">
      <View style={{ gap: 14, paddingHorizontal: 4, paddingBottom: 8 }}>
        <TextInput accessibilityLabel="Goal title" value={title} onChangeText={setTitle} style={styles.input} selectionColor={niche.accent} />
        {goal.kind === 'habit' ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Pressable key={n} accessibilityRole="radio" accessibilityLabel={`${n} a week`} accessibilityState={{ checked: n === perWeek }} onPress={() => setPerWeek(n)} style={[styles.num, n === perWeek ? { backgroundColor: niche.accent } : null]}>
                <Text style={[styles.numText, n === perWeek ? { color: '#FFFFFF' } : null]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <TextInput accessibilityLabel="Target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Target" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
        )}
        <Button label="Save" color={niche.accent} onPress={save} />
      </View>
    </Sheet>
  );
}

const makeStyles = (sf: Surface) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: sf.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6 },
  back: { minHeight: TOUCH, minWidth: 96, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  backText: { fontSize: 17 },
  editButton: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 14 },
  editText: { fontSize: 17, fontWeight: '600' },
  hero: { marginHorizontal: 6, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rule: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  private: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  privateText: { fontSize: 12, fontWeight: '700' },
  big: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  headline: { fontFamily: fonts.display, fontSize: 88, lineHeight: 88, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  caption: { fontSize: 15, fontWeight: '600' },
  stripLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  stripLabel: { fontSize: 11, fontWeight: '600' },
  streak: { fontSize: 15, fontWeight: '700' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneCheck: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 17, fontWeight: '700' },
  reached: { gap: 10, paddingTop: 4 },
  reachedTitle: { fontSize: 16, fontWeight: '700' },
  actions: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: sf.line, marginTop: 4 },
  restTitle: { fontSize: 15, fontWeight: '700', color: sf.text },
  restSub: { fontSize: 13, lineHeight: 18, color: sf.muted },
  switchTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#D5D8D3', padding: 3 },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginTop: 26 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: sf.text },
  emptyText: { fontSize: 14, lineHeight: 20, color: sf.muted, marginTop: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, minHeight: TOUCH },
  checkDot: { width: 8, height: 8, borderRadius: 4 },
  checkWhat: { fontSize: 15, fontWeight: '600', color: sf.text },
  checkWhen: { fontSize: 13, color: sf.muted },
  remove: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 22, color: sf.muted },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: sf.line },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: sf.text },
  optionSub: { fontSize: 13, lineHeight: 18, color: sf.muted },
  check: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  day: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F4F5F2', alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600', color: sf.body },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: '#DADDD8', paddingHorizontal: 14, fontSize: 16, color: sf.text, backgroundColor: '#FFFFFF' },
  num: { flex: 1, height: TOUCH, borderRadius: 12, backgroundColor: '#F4F5F2', alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, fontWeight: '700', color: sf.body },
});

// The check-in and edit sheets are white panels, so they use the plain colors.
const plainStyles = makeStyles(PLAIN_SURFACE);
