import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, FadeInDown, ReduceMotion, SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Eyebrow } from '@/components/discover-parts';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ClockIcon, CloseIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { TimePicker } from '@/components/time-picker';
import { MonthCalendar } from '@/components/month-calendar';
import { Avatar } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast, type ToastAction } from '@/components/toast';
import { dayLabel, isoDay, type PlanKind, type Visibility } from '@/lib/plans';
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
  const params = useLocalSearchParams<{ niche?: NicheId; edit?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const { height } = useWindowDimensions();

  // With `edit=<plan id>` the same sheet edits a plan you host (founder, Nov 19 2026).
  const editing = params.edit ? state.plans.find((p) => p.id === params.edit && p.ownerId === state.me?.id) : undefined;
  const [nicheId, setNicheId] = useState<NicheId>(editing?.niche ?? (params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche));
  const [pickingNiche, setPickingNiche] = useState(false);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState(editing?.date ?? isoDay(1));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [time, setTime] = useState<string | undefined>(editing?.time);
  const [open, setOpen] = useState<Extra[]>(editing ? [...(editing.invitees.length ? (['invite'] as Extra[]) : []), ...(editing.location ? (['place'] as Extra[]) : []), ...(editing.notes ? (['notes'] as Extra[]) : [])] : []);
  const [invitees, setInvitees] = useState<string[]>(editing?.invitees ?? []);
  const [location, setLocation] = useState(editing?.location ?? '');
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [visibility, setVisibility] = useState<Visibility>(editing?.visibility ?? 'private');
  const [timeOpen, setTimeOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Keep what you're typing above the keyboard (founder, Nov 19 2026): the
  // sheet shrinks to the space left, and focusing a box scrolls it into view.
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const viewH = useRef(0);
  const rowsY = useRef(0);
  const spots = useRef<Record<string, { y: number; boxY: number; boxH: number }>>({});
  const reveal = (key: string) =>
    setTimeout(() => {
      const s = spots.current[key];
      if (!s) return;
      const bottom = rowsY.current + s.y + s.boxY + s.boxH + 16;
      const top = rowsY.current + s.y;
      scrollRef.current?.scrollTo({ y: Math.max(0, Math.min(top, bottom - viewH.current)), animated: true });
    }, 320);
  const spot = (key: string, part: 'y' | 'box') => (e: { nativeEvent: { layout: { y: number; height: number } } }) => {
    const cur = spots.current[key] ?? { y: 0, boxY: 0, boxH: 0 };
    spots.current[key] = part === 'y' ? { ...cur, y: e.nativeEvent.layout.y } : { ...cur, boxY: e.nativeEvent.layout.y, boxH: e.nativeEvent.layout.height };
  };

  const niche = niches[nicheId];

  // Messages about this niche come in its dark color (founder, Nov 24 2026).

  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const cooking = nicheId === 'cooking';
  const ready = title.trim().length > 0 && !!state.me;
  const people = SEED_USERS.filter((u) => u.id !== state.me?.id).sort((a, b) => Number(!!state.following[b.id]) - Number(!!state.following[a.id]));
  const otherDay = date !== isoDay(0) && date !== isoDay(1);
  const toggleInvite = (uid: string) => setInvitees((xs) => (xs.includes(uid) ? xs.filter((x) => x !== uid) : [...xs, uid]));
  const q = query.trim().toLowerCase();
  // Typing: anyone whose name or username matches. Empty: a few people you follow you haven't asked yet.
  const matches = q
    ? people.filter((u) => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)).slice(0, 5)
    : people.filter((u) => state.following[u.id] && !invitees.includes(u.id)).slice(0, 3);
  const add = (e: Extra) => {
    tap();
    setOpen((o) => (o.includes(e) ? o : [...o, e]));
    reveal(e);
  };
  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    setItems((xs) => [...xs, v]);
    setDraft('');
    reveal('bring');
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/plans'));

  // Swipe down to close, like Add to diary and New goal.
  const drag = useSharedValue(0);
  const sheetH = useSharedValue(500);
  const pan = usePanGesture({
    // Spinning the time wheels shouldn't pull the sheet down.
    enabled: !timeOpen,
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
    if (editing) {
      const cookingKind = invitees.length || editing.items.length ? 'together' : 'meal';
      actions.updatePlan(editing.id, {
        title: title.trim(),
        niche: nicheId,
        kind: (cooking ? cookingKind : 'outing') as PlanKind,
        date,
        time,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        visibility,
        invitees,
      });
      const added = invitees.filter((u) => !editing.invitees.includes(u)).length;
      close();
      toast(added ? `Plan updated. ${added} ${added === 1 ? 'person' : 'people'} invited.` : 'Plan updated');
      return;
    }
    const pending = draft.trim();
    const allItems = pending ? [...items, pending] : items;
    const id = actions.createPlan({
      ownerId: state.me.id,
      niche: nicheId,
      // The kind follows what you add: a cooking plan with things to bring is a
      // "Cook together", otherwise a meal; other niches make outings.
      kind: (cooking ? (allItems.length || invitees.length ? 'together' : 'meal') : 'outing') as PlanKind,
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
    <Animated.View key={key} onLayout={spot(key, 'y')} entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.section, { borderBottomColor: ground.line }]}>
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
            style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8, shadowColor: niche.ink, maxHeight: height - insets.top - 24, flexShrink: 1 }, sheetStyle]}>
            <View style={styles.grabber} />
            <View style={styles.head}>
              <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>{editing ? 'Edit plan' : 'New plan'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close without saving" onPress={close} hitSlop={6} style={styles.close}>
                <CloseIcon size={20} color={ground.text} />
              </Pressable>
            </View>

            <ScrollView ref={scrollRef} onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)} style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                  autoFocus={Platform.OS !== 'web' && !editing}
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
                    onPress={() => (setCalendarOpen((o) => !o), setTimeOpen(false))}
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
                {/* Any time, picked on a small clock card like the calendar (founder, Nov 19 2026). */}
                <View style={[styles.words, { alignItems: 'center' }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={time ? `${time}. Change the time` : 'Add a time'}
                    accessibilityState={{ expanded: timeOpen }}
                    onPress={() => (setTimeOpen((o) => !o), setCalendarOpen(false), !time && setTime('7:00 PM'))}
                    style={[styles.wordHit, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <ClockIcon size={16} color={time || timeOpen ? ground.text : ground.muted} />
                    <Text style={quiet(!!time)}>{time ?? 'Add a time'}</Text>
                  </Pressable>
                  {time ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Remove the time" onPress={() => (setTime(undefined), setTimeOpen(false))} style={styles.wordHit}>
                      <Text style={[styles.smallLink, { color: ground.muted }]}>No time</Text>
                    </Pressable>
                  ) : null}
                  {timeOpen ? (
                    <Pressable accessibilityRole="button" onPress={() => setTimeOpen(false)} style={[styles.wordHit, { marginLeft: 'auto' }]}>
                      <Text style={[styles.smallLink, { color: ground.text }]}>Done</Text>
                    </Pressable>
                  ) : null}
                </View>
                {timeOpen ? (
                  <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.calCard, { paddingHorizontal: 12 }]}>
                    <TimePicker value={time} onChange={setTime} accent={niche.accent} />
                  </Animated.View>
                ) : null}
              </View>

              {/* What you've added, then + rows for the rest. */}
              <View onLayout={(e) => (rowsY.current = e.nativeEvent.layout.y)} style={[styles.rows, { borderTopColor: ground.line }]}>
                {open.includes('invite')
                  ? section(
                      'invite',
                      cooking ? 'Who’s coming' : 'Who’s coming along',
                      <View style={{ gap: 8 }}>
                        {/* Who you've asked, as small name tags; × takes someone off. */}
                        {invitees.length ? (
                          <View style={styles.chips}>
                            {invitees.map((uid) => {
                              const u = people.find((x) => x.id === uid);
                              return (
                                <Pressable key={uid} accessibilityRole="button" accessibilityLabel={`Remove ${u?.displayName ?? 'person'}`} onPress={() => (tap(), toggleInvite(uid))} style={styles.chip}>
                                  <Avatar user={u} size={24} />
                                  <Text style={[styles.chipText, { color: ground.text }]}>{u?.displayName.split(' ')[0]}</Text>
                                  <CloseIcon size={12} color={ground.muted} />
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : null}
                        {/* Search like Discover, instead of scrolling through everyone (founder, Nov 19 2026). */}
                        <View onLayout={spot('invite', 'box')} style={[styles.smallCard, styles.search]}>
                          <SearchIcon size={17} color={ground.muted} />
                          <TextInput
                            accessibilityLabel="Search people to invite"
                            value={query}
                            onChangeText={setQuery}
                            onFocus={() => reveal('invite')}
                            autoFocus={!editing}
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder="Search people"
                            placeholderTextColor={ground.muted}
                            returnKeyType="search"
                            selectionColor={ground.text}
                            style={[styles.smallInput, { flex: 1, color: ground.text }, webInput]}
                          />
                          {query ? (
                            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                              <CloseIcon size={14} color={ground.muted} />
                            </Pressable>
                          ) : null}
                        </View>
                        {matches.length ? (
                          <View>
                            {!query.trim() ? <Text style={[styles.hint, { color: ground.muted, marginBottom: 2 }]}>Suggested</Text> : null}
                            {matches.map((u) => {
                              const on = invitees.includes(u.id);
                              return (
                                <Pressable
                                  key={u.id}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: on }}
                                  accessibilityLabel={`Invite ${u.displayName}`}
                                  onPress={() => (tap(), toggleInvite(u.id), setQuery(''))}
                                  style={[styles.personRow, { borderBottomColor: ground.line }]}>
                                  <Avatar user={u} size={34} />
                                  <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={[styles.personName, { color: ground.text }]} numberOfLines={1}>{u.displayName}</Text>
                                    <Text style={[styles.personSub, { color: ground.muted }]} numberOfLines={1}>{u.username}{state.following[u.id] ? ' · you follow' : ''}</Text>
                                  </View>
                                  <View style={[styles.box, { borderColor: on ? niche.accent : ground.muted, backgroundColor: on ? niche.accent : 'transparent' }]}>{on ? <CheckIcon size={12} strokeWidth={3.2} /> : null}</View>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : query.trim() ? (
                          <Text style={[styles.hint, { color: ground.muted }]}>No one called “{query.trim()}”.</Text>
                        ) : null}
                      </View>,
                    )
                  : null}
                {open.includes('place')
                  ? section(
                      'place',
                      'Where',
                      <View onLayout={spot('place', 'box')} style={styles.smallCard}>
                        <TextInput accessibilityLabel="Where" value={location} onChangeText={setLocation} onFocus={() => reveal('place')} autoFocus={!editing} maxLength={80} selectionColor={ground.text} style={[styles.smallInput, { color: ground.text }, webInput]} />
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
                        <View onLayout={spot('bring', 'box')} style={[styles.smallCard, { flexDirection: 'row', alignItems: 'center' }]}>
                          <TextInput
                            accessibilityLabel={cooking ? 'Add an ingredient' : 'Add something to bring'}
                            value={draft}
                            onChangeText={setDraft}
                            onSubmitEditing={addItem}
                            onFocus={() => reveal('bring')}
                            submitBehavior="submit"
                            returnKeyType="done"
                            autoFocus={!editing}
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
                      <View onLayout={spot('notes', 'box')} style={styles.smallCard}>
                        <TextInput accessibilityLabel="Notes" value={notes} onChangeText={(t) => (setNotes(t), reveal('notes'))} onFocus={() => reveal('notes')} autoFocus={!editing} multiline maxLength={500} selectionColor={ground.text} style={[styles.notesInput, { color: ground.text }, webInput]} />
                      </View>,
                    )
                  : null}
                {plusRow('invite', 'Invite friends')}
                {plusRow('place', 'Add a place')}
                {/* Things to bring are changed on the plan's page once it exists. */}
                {editing ? null : plusRow('bring', cooking ? 'Who brings what' : 'What to bring', cooking ? 'for cooking together' : undefined)}
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
                <Text style={[styles.saveText, { color: ground.ground }]}>{editing ? 'Save' : 'Make plan'}</Text>
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 3, paddingRight: 10, minHeight: 32, borderRadius: 16, backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  personName: { fontSize: 15, fontWeight: '600' },
  personSub: { fontSize: 12 },
  box: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  smallLink: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
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
