import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, FadeInDown, ReduceMotion, SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Eyebrow } from '@/components/discover-parts';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { MonthCalendar } from '@/components/month-calendar';
import { Avatar } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { CLOCK_TIMES, dayLabel, isoDay, MEAL_TIMES, type PlanKind, type Visibility } from '@/lib/plans';
import { SEED_USERS } from '@/lib/seed';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, type NicheId } from '@/lib/theme';

type Extra = 'invite' | 'place' | 'bring' | 'notes';

const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;
const tap = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

/**
 * Make a plan, as a quick sheet (founder picked option B, Nov 19 2026;
 * canvas page "Plans"): it starts small, a name and a day, and the + rows
 * add only what you need: friends, a place, who brings what, notes. Like Add
 * to diary and New goal: white boxes are where you write, Private / Public
 * sits next to Make plan, and the X, a tap above or a swipe down close it.
 * Dish votes are added on the plan's page.
 */
export default function NewPlanSheet() {
  const params = useLocalSearchParams<{ niche?: NicheId }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const { height } = useWindowDimensions();

  const [nicheId, setNicheId] = useState<NicheId>(params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche);
  const [pickingNiche, setPickingNiche] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(isoDay(1));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState<Extra[]>([]);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');

  const niche = niches[nicheId];
  const cooking = nicheId === 'cooking';
  const times = cooking ? MEAL_TIMES : CLOCK_TIMES;
  const ready = title.trim().length > 0 && !!state.me;
  const people = SEED_USERS.filter((u) => u.id !== state.me?.id).sort((a, b) => Number(!!state.following[b.id]) - Number(!!state.following[a.id]));
  const otherDay = date !== isoDay(0) && date !== isoDay(1);
  const add = (e: Extra) => {
    tap();
    setOpen((o) => (o.includes(e) ? o : [...o, e]));
  };
  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    setItems((xs) => [...xs, v]);
    setDraft('');
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/plans'));

  // Swipe down to close, like Add to diary and New goal.
  const drag = useSharedValue(0);
  const sheetH = useSharedValue(500);
  const pan = usePanGesture({
    activeOffsetY: [-1000, 8],
    failOffsetX: [-20, 20],
    onUpdate: (e) => {
      'worklet';
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (drag.get() > sheetH.get() * 0.3 || e.velocityY > 900) {
        drag.set(withTiming(height, { duration: 200, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.System }, () => scheduleOnRN(close)));
      } else {
        drag.set(withSpring(0, { duration: 300, dampingRatio: 1, reduceMotion: ReduceMotion.System }));
      }
    },
  });
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drag.get() }] }));

  const create = () => {
    if (!ready || !state.me) return;
    const pending = draft.trim();
    const allItems = pending ? [...items, pending] : items;
    const id = actions.createPlan({
      ownerId: state.me.id,
      niche: nicheId,
      // The kind follows what you add: a cooking plan with things to bring is a
      // "Cook together", otherwise a meal; other niches make outings.
      kind: (cooking ? (allItems.length ? 'together' : 'meal') : 'outing') as PlanKind,
      title: title.trim(),
      date,
      time,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      visibility,
      invitees,
      items: allItems,
      dishIdeas: [],
    });
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    close();
    toast(invitees.length ? `Plan made. ${invitees.length} ${invitees.length === 1 ? 'person' : 'people'} invited.` : 'Plan made', {
      label: 'Open',
      onPress: () => router.push({ pathname: '/plans/[id]', params: { id } }),
    });
  };

  const quiet = (on: boolean, color = ground.text) => [styles.word, { color: on ? ground.text : ground.muted, fontWeight: on ? ('700' as const) : ('500' as const), borderBottomColor: on ? color : 'transparent' }];
  const plusRow = (e: Extra, label: string, sub?: string) =>
    open.includes(e) ? null : (
      <Pressable key={e} accessibilityRole="button" onPress={() => add(e)} style={[styles.row, { borderBottomColor: ground.line }]}>
        <PlusIcon size={16} color={ground.muted} strokeWidth={2.4} />
        <Text style={[styles.rowText, { color: ground.text }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: ground.muted }]}>{sub}</Text> : null}
      </Pressable>
    );
  const section = (key: string, label: string, children: ReactNode) => (
    <Animated.View key={key} entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.section, { borderBottomColor: ground.line }]}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </Animated.View>
  );

  return (
    <SurfaceProvider value={ground}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Nothing behind is dimmed (founder); tap above the sheet to close. */}
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1, minHeight: insets.top + 24 }} onPress={close} />
        <GestureDetector gesture={pan}>
          <Animated.View
            entering={SlideInDown.duration(320).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}
            onLayout={(e) => sheetH.set(e.nativeEvent.layout.height)}
            accessibilityViewIsModal
            style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8, shadowColor: niche.ink, maxHeight: height - insets.top - 24 }, sheetStyle]}>
            <View style={styles.grabber} />
            <View style={styles.head}>
              <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>New plan</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close without saving" onPress={close} hitSlop={6} style={styles.close}>
                <CloseIcon size={20} color={ground.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* The niche as one small word; tap it to pick another. */}
              {pickingNiche ? (
                <View accessibilityRole="radiogroup" style={styles.niches}>
                  {NICHE_ORDER.map((id) => (
                    <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: id === nicheId }} onPress={() => (setNicheId(id), setPickingNiche(false), setTime(undefined))} style={styles.nicheHit}>
                      <View style={[styles.dot, { backgroundColor: niches[id].accent }]} />
                      <Text style={[styles.nicheText, { color: id === nicheId ? ground.text : ground.muted, fontWeight: id === nicheId ? '700' : '500' }]}>{niches[id].label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Pressable accessibilityRole="button" accessibilityLabel={`${niche.label}. Change niche`} onPress={() => setPickingNiche(true)} style={styles.nicheHit}>
                  <View style={[styles.dot, { backgroundColor: niche.accent }]} />
                  <Text style={[styles.nicheText, { color: ground.text, fontWeight: '700' }]}>{niche.label}</Text>
                  <View style={{ transform: [{ rotate: '-90deg' }] }}>
                    <ChevronLeftIcon size={14} color={ground.text} />
                  </View>
                </Pressable>
              )}

              <View style={styles.card}>
                <TextInput
                  accessibilityLabel="Plan name"
                  value={title}
                  onChangeText={setTitle}
                  multiline
                  {...(Platform.OS === 'web' ? { rows: 1 } : null)}
                  maxLength={60}
                  autoFocus={Platform.OS !== 'web'}
                  selectionColor={ground.text}
                  style={[styles.titleInput, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none', fieldSizing: 'content' } as object) : null]}
                />
              </View>

              {/* When: Today · Tomorrow · any day from the calendar, then a meal or a time. */}
              <View style={{ gap: 2 }}>
                <View accessibilityRole="radiogroup" style={styles.words}>
                  {[isoDay(0), isoDay(1)].map((d, i) => (
                    <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: d === date }} onPress={() => (setDate(d), setCalendarOpen(false))} style={styles.wordHit}>
                      <Text style={quiet(d === date)}>{i === 0 ? 'Today' : 'Tomorrow'}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={otherDay ? `${dayLabel(date)}. Pick another day` : 'Pick a day on the calendar'}
                    accessibilityState={{ expanded: calendarOpen }}
                    onPress={() => setCalendarOpen((o) => !o)}
                    style={[styles.wordHit, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <CalendarIcon size={16} color={otherDay || calendarOpen ? ground.text : ground.muted} />
                    <Text style={quiet(otherDay)}>{otherDay ? dayLabel(date) : 'Another day'}</Text>
                  </Pressable>
                </View>
                {calendarOpen ? (
                  <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={styles.calCard}>
                    <MonthCalendar value={date} min={isoDay(0)} accent={niche.accent} onChange={(d) => (setDate(d), setCalendarOpen(false))} />
                  </Animated.View>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.words}>
                  {times.map((t) => (
                    <Pressable key={t} accessibilityRole="radio" accessibilityState={{ checked: t === time }} onPress={() => setTime(t === time ? undefined : t)} style={styles.wordHit}>
                      <Text style={[quiet(t === time, niche.accent), { fontSize: 14 }]}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* What you've added, then + rows for the rest. */}
              <View style={[styles.rows, { borderTopColor: ground.line }]}>
                {open.includes('invite')
                  ? section(
                      'invite',
                      cooking ? 'Who’s coming' : 'Who’s coming along',
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
                        {people.map((u) => {
                          const on = invitees.includes(u.id);
                          return (
                            <Pressable
                              key={u.id}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: on }}
                              accessibilityLabel={`Invite ${u.displayName}`}
                              onPress={() => (tap(), setInvitees(on ? invitees.filter((x) => x !== u.id) : [...invitees, u.id]))}
                              style={styles.person}>
                              <View style={{ opacity: on ? 1 : 0.55 }}>
                                <Avatar user={u} size={44} />
                              </View>
                              {on ? (
                                <Animated.View entering={FadeIn.duration(150)} style={[styles.tick, { backgroundColor: niche.accent, borderColor: ground.ground }]}>
                                  <CheckIcon size={11} strokeWidth={3.2} />
                                </Animated.View>
                              ) : null}
                              <Text style={[styles.personName, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500' }]} numberOfLines={1}>
                                {u.displayName.split(' ')[0]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>,
                    )
                  : null}
                {open.includes('place')
                  ? section(
                      'place',
                      'Where',
                      <View style={styles.smallCard}>
                        <TextInput accessibilityLabel="Where" value={location} onChangeText={setLocation} autoFocus maxLength={80} selectionColor={ground.text} style={[styles.smallInput, { color: ground.text }, webInput]} />
                      </View>,
                    )
                  : null}
                {open.includes('bring')
                  ? section(
                      'bring',
                      cooking ? 'Who brings what' : 'What to bring',
                      <View style={{ gap: 6 }}>
                        {items.map((it, i) => (
                          <View key={`${it}-${i}`} style={[styles.item, { borderBottomColor: ground.line }]}>
                            <Text style={[styles.itemText, { color: ground.text }]}>{it}</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${it}`} hitSlop={8} onPress={() => setItems(items.filter((_, j) => j !== i))}>
                              <CloseIcon size={14} color={ground.muted} />
                            </Pressable>
                          </View>
                        ))}
                        <View style={[styles.smallCard, { flexDirection: 'row', alignItems: 'center' }]}>
                          <TextInput
                            accessibilityLabel={cooking ? 'Add an ingredient' : 'Add something to bring'}
                            value={draft}
                            onChangeText={setDraft}
                            onSubmitEditing={addItem}
                            submitBehavior="submit"
                            returnKeyType="done"
                            autoFocus
                            maxLength={60}
                            selectionColor={ground.text}
                            style={[styles.smallInput, { flex: 1, color: ground.text }, webInput]}
                          />
                          {draft.trim() ? (
                            <Pressable accessibilityRole="button" onPress={addItem} hitSlop={8}>
                              <Text style={[styles.addText, { color: ground.text }]}>Add</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        {cooking ? <Text style={[styles.hint, { color: ground.muted }]}>People pick what they’ll bring on the plan’s page.</Text> : null}
                      </View>,
                    )
                  : null}
                {open.includes('notes')
                  ? section(
                      'notes',
                      'Notes',
                      <View style={styles.smallCard}>
                        <TextInput accessibilityLabel="Notes" value={notes} onChangeText={setNotes} autoFocus multiline maxLength={500} selectionColor={ground.text} style={[styles.notesInput, { color: ground.text }, webInput]} />
                      </View>,
                    )
                  : null}
                {plusRow('invite', 'Invite friends')}
                {plusRow('place', 'Add a place')}
                {plusRow('bring', cooking ? 'Who brings what' : 'What to bring', cooking ? 'for cooking together' : undefined)}
                {plusRow('notes', 'Add notes')}
              </View>
            </ScrollView>

            <View style={styles.foot}>
              <View accessibilityRole="radiogroup" accessibilityLabel="Who can see this plan" style={styles.toggle}>
                {(['private', 'public'] as Visibility[]).map((v) => {
                  const on = visibility === v;
                  return (
                    <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.toggleItem, on && { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.toggleText, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500' }]}>{v === 'private' ? 'Private' : 'Public'}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flex: 1 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={create}
                style={({ pressed }) => [styles.save, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
                <Text style={[styles.saveText, { color: ground.ground }]}>Make plan</Text>
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 10, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,26,20,0.18)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,26,20,0.07)', alignItems: 'center', justifyContent: 'center' },
  niches: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 },
  nicheHit: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, alignSelf: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  nicheText: { fontSize: 14 },
  card: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, backgroundColor: '#FFFFFF' },
  titleInput: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, minHeight: 31, paddingVertical: 0 },
  words: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 },
  wordHit: { minHeight: 40, justifyContent: 'center' },
  word: { fontSize: 15, paddingBottom: 5, borderBottomWidth: 2.5 },
  calCard: { marginVertical: 4, paddingHorizontal: 10, paddingBottom: 8, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#1F1A14', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  rowText: { fontSize: 15, fontWeight: '600' },
  rowSub: { marginLeft: 'auto', fontSize: 13 },
  section: { paddingVertical: 10, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  person: { width: 58, alignItems: 'center', gap: 4 },
  tick: { position: 'absolute', top: 28, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  personName: { fontSize: 12 },
  smallCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF' },
  smallInput: { fontSize: 15, minHeight: 24, paddingVertical: 0 },
  notesInput: { fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 24, minHeight: 50, paddingVertical: 0, textAlignVertical: 'top' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 38, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  itemText: { fontSize: 15 },
  addText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  hint: { fontSize: 13 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(31,26,20,0.07)' },
  toggleItem: { minHeight: 36, paddingHorizontal: 14, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14 },
  save: { minHeight: 48, paddingHorizontal: 26, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
});
