import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ChevronLeftIcon, CloseIcon } from '@/components/icons';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { PERIODS, type GoalKind, type GoalVisibility, type Period } from '@/lib/goals';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

const MAX_PER: Record<Period, number> = { week: 7, month: 31, year: 365 };

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

/**
 * New goal, as a quick sheet (founder picked round 3's option C, Nov 19 2026,
 * "very similar to the diary entry"): type the goal however you like, how many
 * times a week / month / year with − / +, Private or Public, Set goal. A total
 * to reach is one link away (and a personal best, in Gym). Swipe down, tap
 * above or the X to close. Everything else can be changed on the goal later.
 */
export default function NewGoalSheet() {
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
  const [kind, setKind] = useState<GoalKind>('habit');
  const [title, setTitle] = useState('');
  const [perWeek, setPerWeek] = useState(3);
  const [period, setPeriod] = useState<Period>('week');
  const [target, setTarget] = useState('10');
  const [unit, setUnit] = useState('');
  const [start, setStart] = useState('');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [visibility, setVisibility] = useState<GoalVisibility>('private');

  const niche = niches[nicheId];
  const t = num(target);
  const s0 = num(start);
  const ready = !!state.me && title.trim().length > 0 && (kind === 'habit' || (t !== undefined && t > 0)) && (kind !== 'best' || (s0 !== undefined && unit.trim().length > 0 && s0 !== t));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));

  // Swipe down to close, like Add to diary.
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

  const save = () => {
    if (!ready || !state.me) return;
    const id = actions.createGoal({
      userId: state.me.id,
      niche: nicheId,
      kind,
      title: title.trim(),
      perWeek: kind === 'habit' ? perWeek : undefined,
      period: kind === 'habit' && period !== 'week' ? period : undefined,
      target: kind === 'habit' ? undefined : t,
      unit: kind === 'habit' ? undefined : unit.trim() || undefined,
      start: kind === 'best' ? s0 : undefined,
      direction: kind === 'best' ? direction : undefined,
      visibility,
    });
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    close();
    toast(visibility === 'private' ? 'Goal set. Only you can see it.' : 'Goal set and on your profile', { label: 'Open', onPress: () => router.push({ pathname: '/goals/[id]', params: { id } }) });
  };

  const stepButtons = (onLess: () => void, onMore: () => void, lessOff = false, moreOff = false) => (
    <View style={styles.steps}>
      <Pressable accessibilityRole="button" accessibilityLabel="Less" disabled={lessOff} onPress={onLess} style={[styles.step, { borderColor: ground.text, opacity: lessOff ? 0.3 : 1 }]}>
        <Text style={[styles.stepText, { color: ground.text }]}>−</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="More" disabled={moreOff} onPress={onMore} style={[styles.step, { borderColor: ground.text, opacity: moreOff ? 0.3 : 1 }]}>
        <Text style={[styles.stepText, { color: ground.text }]}>+</Text>
      </Pressable>
    </View>
  );
  const link = (lead: string, action: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkRow}>
      <Text style={[styles.linkText, { color: ground.muted }]}>
        {lead} <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>{action}</Text>
      </Text>
    </Pressable>
  );
  // Each box is as wide as what's typed in it, so the line reads like a sentence:
  // "Reach 13 loaves" (founder, Nov 20 2026). An invisible copy of the text sets the width.
  const field = (value: string, set: (v: string) => void, label: string, minWidth: number, numeric = true) => (
    <View style={[styles.sizer, { borderBottomColor: ground.muted, minWidth }]}>
      <Text style={[styles.inline, styles.ghost]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {value || ' '}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={set}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        maxLength={numeric ? 7 : undefined}
        selectionColor={ground.text}
        style={[styles.inline, styles.fill, { color: ground.text, textAlign: 'center' }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
      />
    </View>
  );

  return (
    <SurfaceProvider value={ground}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Nothing behind is dimmed (founder); tap above the sheet to close. */}
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} onPress={close} />
        <GestureDetector gesture={pan}>
          <Animated.View
            entering={SlideInDown.duration(320).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}
            onLayout={(e) => sheetH.set(e.nativeEvent.layout.height)}
            accessibilityViewIsModal
            style={[styles.sheet, { backgroundColor: ground.ground, paddingBottom: Math.max(insets.bottom, 16) + 8, shadowColor: niche.ink }, sheetStyle]}>
            <View style={styles.grabber} />
            <View style={styles.head}>
              <Text accessibilityRole="header" style={[styles.heading, { color: ground.text }]}>New goal</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close without saving" onPress={close} hitSlop={6} style={styles.close}>
                <CloseIcon size={20} color={ground.text} />
              </Pressable>
            </View>

            {/* The niche as one small word; tap it to pick another. */}
            {pickingNiche ? (
              <View accessibilityRole="radiogroup" style={styles.niches}>
                {NICHE_ORDER.map((id) => (
                  <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: id === nicheId }} onPress={() => (setNicheId(id), setPickingNiche(false))} style={styles.nicheHit}>
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
                accessibilityLabel="Goal title"
                value={title}
                onChangeText={setTitle}
                multiline
                autoFocus={Platform.OS !== 'web'}
                selectionColor={ground.text}
                style={[styles.goalInput, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none', fieldSizing: 'content' } as object) : null]}
              />
            </View>

            {kind === 'habit' ? (
              <>
                <View style={styles.row}>
                  <Text style={[styles.rowValue, { color: ground.text }]}>
                    {perWeek === 1 ? 'Once a ' : `${perWeek} times a `}
                    {/* Tap the time frame to switch between week, month and year. */}
                    <Text
                      accessibilityRole="button"
                      accessibilityLabel={`A ${period}. Change to a ${PERIODS[(PERIODS.indexOf(period) + 1) % PERIODS.length]}`}
                      onPress={() => {
                        const next = PERIODS[(PERIODS.indexOf(period) + 1) % PERIODS.length];
                        setPeriod(next);
                        setPerWeek((n) => Math.min(n, MAX_PER[next]));
                      }}
                      style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: niche.accent }}>
                      {period}
                    </Text>
                  </Text>
                  {stepButtons(() => setPerWeek(Math.max(1, perWeek - 1)), () => setPerWeek(Math.min(MAX_PER[period], perWeek + 1)), perWeek <= 1, perWeek >= MAX_PER[period])}
                </View>
                {link('Counting to a total instead?', 'Set a number', () => setKind('total'))}
              </>
            ) : kind === 'total' ? (
              <>
                <View style={styles.row}>
                  <View style={styles.inlineRow}>
                    <Text style={[styles.rowValue, { color: ground.text }]}>Reach</Text>
                    {field(target, setTarget, 'Number to reach', 28)}
                    {field(unit, setUnit, 'Of what, like loaves', 70, false)}
                  </View>
                  {stepButtons(() => setTarget(String(Math.max(1, (t ?? 1) - 1))), () => setTarget(String((t ?? 0) + 1)), (t ?? 1) <= 1)}
                </View>
                {link('Doing it regularly instead?', 'Times a week', () => setKind('habit'))}
                {nicheId === 'gym' ? link('Chasing a time or a lift?', 'Beat a personal best', () => setKind('best')) : null}
              </>
            ) : (
              <>
                <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                  <View style={styles.inlineRow}>
                    <Text style={[styles.rowValue, { color: ground.text }]}>From</Text>
                    {field(start, setStart, 'Where you are now', 28)}
                    <Text style={[styles.rowValue, { color: ground.text }]}>to</Text>
                    {field(target, setTarget, 'Your goal', 28)}
                    {field(unit, setUnit, 'Unit, like kg or min', 44, false)}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 18 }}>
                    {(['up', 'down'] as const).map((d) => (
                      <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: d === direction }} onPress={() => setDirection(d)} style={styles.linkRow}>
                        <Text style={[styles.linkText, { color: d === direction ? ground.text : ground.muted, fontWeight: d === direction ? '700' : '500', textDecorationLine: d === direction ? 'underline' : 'none' }]}>
                          {d === 'up' ? 'Higher is better' : 'Lower is better'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {link('Doing it regularly instead?', 'Times a week', () => setKind('habit'))}
              </>
            )}

            <View style={[styles.foot, { borderTopColor: ground.line }]}>
              {/* Private or public, right here (founder, Nov 19 2026). */}
              <View accessibilityRole="radiogroup" accessibilityLabel="Who can see this goal" style={styles.toggle}>
                {(['private', 'profile'] as GoalVisibility[]).map((v) => {
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
                onPress={save}
                style={({ pressed }) => [styles.save, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
                <Text style={[styles.saveText, { color: ground.ground }]}>Set goal</Text>
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 12, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(31,26,20,0.18)' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,26,20,0.07)', alignItems: 'center', justifyContent: 'center' },
  niches: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 },
  nicheHit: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, alignSelf: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  nicheText: { fontSize: 14 },
  card: { padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF' },
  goalInput: { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, minHeight: 66, maxHeight: 170, paddingVertical: 2, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 52 },
  rowValue: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, flexShrink: 1 },
  steps: { flexDirection: 'row', gap: 8 },
  step: { width: TOUCH, height: TOUCH, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, lineHeight: 24 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', columnGap: 6, rowGap: 6, flexShrink: 1 },
  inline: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, paddingVertical: 0 },
  sizer: { borderBottomWidth: 1, paddingHorizontal: 4 },
  ghost: { opacity: 0 },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, padding: 0, margin: 0 },
  linkRow: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontSize: 14 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 12 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(31,26,20,0.07)' },
  toggleItem: { minHeight: 36, paddingHorizontal: 14, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14 },
  save: { minHeight: 48, paddingHorizontal: 26, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
});
