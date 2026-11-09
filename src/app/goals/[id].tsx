import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar, WeekStrip } from '@/components/goals';
import { CheckIcon, ChevronLeftIcon, LockIcon } from '@/components/icons';
import { PostSquares } from '@/components/profile-view';
import { Button, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { SurfaceProvider } from '@/components/surface';
import { useToast } from '@/components/toast';
import { diaryWords } from '@/lib/diary';
import { currentBest, fmt, goalRule, longestStreak, progress, streak, weekKey, type Goal, type WeekCell } from '@/lib/goals';
import { dayLabel, isoDay } from '@/lib/plans';
import { isVisible, useNiches, useStore } from '@/lib/store';
import { floodSurface, fonts, PLAIN_SURFACE, TOUCH, type Surface } from '@/lib/theme';

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [checkingIn, setCheckingIn] = useState(false);
  const [editing, setEditing] = useState(false);

  const goal = state.goals.find((g) => g.id === id);
  // A goal's screen is flooded in its niche's color.
  const surface = goal ? floodSurface(niches[goal.niche]) : PLAIN_SURFACE;
  const styles = useMemo(() => makeStyles(surface), [surface]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/goals'));
  const isMine = !!goal && goal.userId === state.me?.id;

  if (!goal || (!isMine && goal.visibility !== 'profile')) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, padding: 20, gap: 16 }]}>
        <Text style={{ fontSize: 17 }}>This goal isn’t available.</Text>
        <Button label="Back" onPress={goBack} />
      </View>
    );
  }

  const niche = niches[goal.niche];
  const owner = usersById[goal.userId];
  const p = progress(goal);
  const s = goal.kind === 'habit' ? streak(goal) : 0;
  const best = goal.kind === 'habit' ? longestStreak(goal) : 0;
  const hidden = !isMine && !!goal.hideNumbers;
  const done = !!goal.doneAt;
  const thisWeek = weekKey(isoDay());
  const resting = goal.restWeeks.includes(thisWeek);
  const posts = state.posts.filter((x) => x.goalId === goal.id && (isMine ? !x.archived : isVisible(state, x))).sort((a, b) => b.createdAt - a.createdAt);
  const history = [...goal.checkIns].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const words = diaryWords(goal.niche);

  const onWeek = (c: WeekCell) => {
    if (!isMine || done) return;
    if (c.met) return toast('You hit your number that week');
    if (c.key > thisWeek) return;
    actions.toggleRestWeek(goal.id, c.key);
    toast(c.rest ? 'Rest week removed' : 'Marked as a rest week. Streak safe.');
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
    <SurfaceProvider value={surface}>
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={niche.ink} />
          <Text style={[styles.backText, { color: niche.ink }]}>{isMine ? 'Goals' : owner?.username ?? 'Back'}</Text>
        </Pressable>
        {isMine ? (
          <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.editButton}>
            <Text style={[styles.editText, { color: niche.ink }]}>Edit</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={[styles.rule, { color: niche.inkSoft }]}>
              {niche.label} · {goalRule(goal)}
            </Text>
            {isMine && goal.visibility === 'private' ? (
              <View style={styles.private}>
                <LockIcon size={12} color={niche.ink} />
                <Text style={[styles.privateText, { color: niche.ink }]}>Just you</Text>
              </View>
            ) : null}
          </View>
          <DisplayText size={30} color={niche.ink}>{goal.title}</DisplayText>

          {done ? (
            <View style={styles.doneRow}>
              <View style={[styles.doneCheck, { backgroundColor: niche.accent }]}>
                <CheckIcon size={18} />
              </View>
              <Text style={[styles.doneText, { color: niche.ink }]}>Done {new Date(goal.doneAt!).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</Text>
            </View>
          ) : hidden ? null : (
            <View style={styles.big}>
              <Text style={[styles.headline, { color: niche.ink }]}>{p.headline}</Text>
              <Text style={[styles.caption, { color: niche.inkSoft }]}>{p.caption}</Text>
            </View>
          )}

          {goal.kind === 'habit' ? (
            <View style={{ gap: 8 }}>
              <WeekStrip goal={goal} weeks={12} color={niche.accent} field="#FFFFFF" onPressWeek={isMine && !done ? onWeek : undefined} />
              <View style={styles.stripLabels}>
                <Text style={[styles.stripLabel, { color: niche.inkSoft }]}>12 weeks ago</Text>
                <Text style={[styles.stripLabel, { color: niche.inkSoft }]}>This week</Text>
              </View>
              {hidden ? null : (
                <Text style={[styles.streak, { color: niche.ink }]}>
                  {s > 0 ? `${s}-week streak` : 'No streak yet'}
                  {best > s ? ` · best ${best}` : ''}
                </Text>
              )}
            </View>
          ) : (
            <ProgressBar fraction={done ? 1 : p.fraction} color={niche.accent} track="#FFFFFF" height={10} />
          )}

          {isMine && !done && p.reached ? (
            <View style={styles.reached}>
              <Text style={[styles.reachedTitle, { color: niche.ink }]}>You reached your target.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Mark as done" color={niche.accent} style={{ flex: 1 }} onPress={() => { actions.setGoalDone(goal.id, true); toast('Goal done. Nice work.'); }} />
                <Button label="Raise it" tone="inverse" color={niche.ink} style={{ flex: 1 }} onPress={() => setEditing(true)} />
              </View>
            </View>
          ) : null}
        </View>

        {isMine && !done ? (
          <View style={styles.actions}>
            <Button label="Check in" color={niche.accent} onPress={() => setCheckingIn(true)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label={words.did}
                tone="outline"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/log/new', params: { niche: goal.niche, goalId: goal.id } })}
              />
              {niche.open ? (
                <Button label="Progress post" tone="outline" style={{ flex: 1 }} onPress={() => router.navigate({ pathname: '/create', params: { goalId: goal.id } })} />
              ) : null}
            </View>
            {goal.kind === 'habit' ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: resting }}
                onPress={() => {
                  actions.toggleRestWeek(goal.id, thisWeek);
                  toast(resting ? 'Rest week removed' : 'Rest week. Your streak is safe.');
                }}
                style={[styles.restRow, resting ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.restTitle}>Take this week off</Text>
                  <Text style={styles.restSub}>Rest weeks keep your streak. Rest is part of getting better.</Text>
                </View>
                <View style={[styles.switchTrack, resting ? { backgroundColor: niche.accent } : null]}>
                  <View style={[styles.switchKnob, resting ? { transform: [{ translateX: 18 }] } : null]} />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {posts.length ? (
          <View style={{ marginTop: 26 }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginBottom: 10 }]}>Progress posts · {posts.length}</Text>
            <PostSquares posts={posts} />
          </View>
        ) : null}

        {isMine ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check-ins · {history.length}</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>Nothing yet. Check in when you {goal.niche === 'cooking' ? 'cook' : 'do it'}, log it with “{words.did}”, or share a progress post.</Text>
            ) : (
              history.slice(0, 30).map((c) => {
                const log = c.logId ? state.logs.find((l) => l.id === c.logId) : undefined;
                const post = c.postId ? state.posts.find((x) => x.id === c.postId) : undefined;
                const what = log ? log.title : post ? 'Progress post' : c.note ?? 'Checked in';
                const value = goal.kind === 'best' && c.value !== undefined ? `${fmt(c.value)} ${goal.unit ?? ''}` : goal.kind === 'total' && (c.value ?? 1) !== 1 ? `+${fmt(c.value!)}` : '';
                return (
                  <View key={c.id} style={styles.checkRow}>
                    <View style={[styles.checkDot, { backgroundColor: niche.accent }]} />
                    <Pressable
                      accessibilityRole={log || post ? 'button' : 'text'}
                      disabled={!log && !post}
                      onPress={() => (log ? router.push({ pathname: '/log/[id]', params: { id: log.id } }) : post ? router.push({ pathname: '/post/[id]', params: { id: post.id } }) : undefined)}
                      style={{ flex: 1, minWidth: 0, gap: 1 }}>
                      <Text style={styles.checkWhat} numberOfLines={1}>{what}{value ? ` · ${value}` : ''}</Text>
                      <Text style={styles.checkWhen}>
                        {dayLabel(c.date)}
                        {c.note && (log || post) ? ` · ${c.note}` : ''}
                      </Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Remove check-in" onPress={() => { actions.removeCheckIn(goal.id, c.id); toast('Check-in removed'); }} style={styles.remove}>
                      <Text style={styles.removeText}>×</Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {isMine ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who can see it</Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {(['private', 'profile'] as const).map((v) => {
                const on = goal.visibility === v;
                return (
                  <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => actions.updateGoal(goal.id, { visibility: v })} style={[styles.option, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                    <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.optionTitle}>{v === 'private' ? 'Just me' : 'On my profile'}</Text>
                      <Text style={styles.optionSub}>{v === 'private' ? 'Nobody else sees it.' : goal.hideNumbers ? 'Shown without numbers.' : 'Shown with your progress.'}</Text>
                    </View>
                  </Pressable>
                );
              })}
              {goal.visibility === 'profile' ? (
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!goal.hideNumbers }} onPress={() => actions.updateGoal(goal.id, { hideNumbers: !goal.hideNumbers })} style={styles.check}>
                  <View style={[styles.box, goal.hideNumbers ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>{goal.hideNumbers ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
                  <Text style={styles.optionTitle}>Hide my numbers from others</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ gap: 8, marginTop: 18 }}>
              <Button tone="outline" label={done ? 'Reopen goal' : 'Mark as done'} onPress={() => { actions.setGoalDone(goal.id, !done); toast(done ? 'Goal reopened' : 'Goal done. Nice work.'); }} />
              <Button tone="ghost" label="Delete goal" textStyle={{ color: niche.ink }} onPress={confirmDelete} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {isMine ? <CheckInSheet goal={goal} visible={checkingIn} onClose={() => setCheckingIn(false)} /> : null}
      {isMine ? <EditSheet goal={goal} visible={editing} onClose={() => setEditing(false)} /> : null}
    </View>
    </SurfaceProvider>
  );
}

/** Check in: when, plus the number for totals and personal bests, plus an optional note. */
function CheckInSheet({ goal, visible, onClose }: { goal: Goal; visible: boolean; onClose: () => void }) {
  const styles = plainStyles;
  const { actions } = useStore();
  const toast = useToast();
  const niche = useNiches()[goal.niche];
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
  const toast = useToast();
  const niche = useNiches()[goal.niche];
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
        <TextInput accessibilityLabel="Goal title" value={title} onChangeText={setTitle} maxLength={60} style={styles.input} selectionColor={niche.accent} />
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
