import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CheckIcon, LockIcon, PlusIcon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { goalRule, periodOf, progress, streak, weekDone, weekStrip, type Goal, type WeekCell } from '@/lib/goals';
import { isoDay } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

/** A progress bar that eases to its new value instead of jumping. */
export function ProgressBar({ fraction, color, track = colors.hairline, height = 8 }: { fraction: number; color: string; track?: string; height?: number }) {
  const value = useSharedValue(fraction);
  useEffect(() => {
    value.value = withSpring(fraction, { duration: 600, dampingRatio: 1, reduceMotion: ReduceMotion.System });
  }, [fraction, value]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, value.value)) * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

/**
 * The last few weeks as a row of dots: filled when you hit your number, a
 * ring for some progress, a dash for a rest week. Missed weeks are just empty;
 * nothing turns red.
 */
export function WeekStrip({ goal, weeks = 12, color, field, onPressWeek }: { goal: Goal; weeks?: number; color: string; field: string; onPressWeek?: (cell: WeekCell) => void }) {
  const cells = weekStrip(goal, weeks);
  return (
    <View style={styles.strip} accessibilityLabel={`Last ${weeks} weeks: ${cells.filter((c) => c.met).length} hit, ${cells.filter((c) => c.rest).length} rest`}>
      {cells.map((c) => {
        const size = 18;
        const dot = c.met ? (
          <View style={[styles.dot, { width: size, height: size, backgroundColor: color }]}>
            <CheckIcon size={11} strokeWidth={3.2} />
          </View>
        ) : c.rest ? (
          <View style={[styles.dot, { width: size, height: size, backgroundColor: field }]}>
            <View style={{ width: 8, height: 2.5, borderRadius: 2, backgroundColor: color }} />
          </View>
        ) : c.count > 0 ? (
          <View style={[styles.dot, { width: size, height: size, borderWidth: 2.5, borderColor: color }]} />
        ) : c.beforeStart ? (
          // Before the goal existed: a small dot, so the strip still reads as a timeline.
          <View style={[styles.dot, { width: size, height: size }]}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
          </View>
        ) : (
          <View style={[styles.dot, { width: size, height: size, backgroundColor: colors.hairline }]} />
        );
        return onPressWeek ? (
          <Pressable key={c.key} accessibilityRole="button" accessibilityLabel={`Week of ${c.key}`} onPress={() => onPressWeek(c)} style={[styles.cell, c.current ? { borderColor: color } : null]}>
            {dot}
          </Pressable>
        ) : (
          <View key={c.key} style={[styles.cell, c.current ? { borderColor: color } : null]}>
            {dot}
          </View>
        );
      })}
    </View>
  );
}

/** A ring that fills as a goal moves along (founder picked option B's rings, Nov 18 2026). */
export function GoalRing({ fraction, color, size = 64, stroke = 7, track = 'rgba(31,26,20,0.08)', children }: { fraction: number; color: string; size?: number; stroke?: number; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {f > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} /> : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}

/** The short number inside a goal's ring: "1/2" this week, "14" loaves, "25:40" best. */
export function ringLabel(goal: Goal) {
  const p = progress(goal);
  if (goal.kind === 'habit') return p.headline === 'Rest week' ? 'Rest' : p.headline.replace(' of ', '/');
  if (goal.kind === 'total') return p.headline.split(' / ')[0];
  return p.headline.split(' ')[0];
}

/** The line under a goal's name in a list. */
export function goalSubline(goal: Goal) {
  if (goal.doneAt) return `Done ${new Date(goal.doneAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const p = progress(goal);
  if (goal.kind === 'habit') {
    const s = streak(goal);
    const w = weekDone(goal);
    const per = periodOf(goal);
    // Past the goal it says so in words, no math (founder picked option 4, Nov 20 2026).
    if (w.done) return `${w.extra ? `Beat it this ${per}` : `Done this ${per}`}${s > 1 ? ` · ${s}-${per} streak` : ''}`;
    return `${p.headline === 'Rest week' ? 'Rest week' : `${p.headline} this ${per}`}${s > 1 ? ` · ${s}-${per} streak` : ''}`;
  }
  if (goal.kind === 'total') return `${p.headline.replace(' / ', ' of ')} ${goal.unit ?? ''}`.trim();
  return p.caption.replace('best so far · ', 'Best so far · ');
}

/**
 * A goal in a list (option B): a white card with its ring in the niche's
 * color, the name in serif, one line of progress, and a + to check in
 * without opening it. Weekly goals and totals check in at once (with Undo);
 * a personal best needs a number, so + opens the goal.
 */
export function GoalCard({ goal, viewerIsOwner = true }: { goal: Goal; viewerIsOwner?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { actions } = useStore();
  const niche = useNiches()[goal.niche];
  const p = progress(goal);
  const hidden = !viewerIsOwner && goal.hideNumbers;
  const done = !!goal.doneAt;
  const label = ringLabel(goal);
  const open = (params: Record<string, string> = {}) => router.push({ pathname: '/goals/[id]', params: { id: goal.id, ...params } });

  const quick = () => {
    if (goal.kind === 'best') return open({ checkin: '1' });
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const id = actions.checkIn(goal.id, { date: isoDay() });
    toast(goal.kind === 'total' ? `+1 ${goal.unit ?? ''}`.trim() : `Logged for ${goal.title}`, { label: 'Undo', onPress: () => actions.removeCheckIn(goal.id, id) });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${niche.label} goal: ${goal.title}. ${hidden ? '' : goalSubline(goal)}`}
      onPress={() => open()}
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <GoalRing fraction={done ? 1 : hidden ? 0 : p.fraction} color={niche.accent}>
        {done || weekDone(goal).done ? (
          <CheckIcon size={22} color={niche.accent} strokeWidth={2.6} />
        ) : hidden ? null : (
          <Text style={[styles.ringText, { color: colors.text, fontSize: label.length > 3 ? 15 : 19 }]} numberOfLines={1}>{label}</Text>
        )}
      </GoalRing>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.title} numberOfLines={2}>{goal.title}</Text>
        <View style={styles.subRow}>
          {viewerIsOwner && goal.visibility === 'private' ? <LockIcon size={11} color={colors.textMuted} /> : null}
          <Text style={styles.meta} numberOfLines={1}>{hidden ? goalRule(goal) : goalSubline(goal)}</Text>
        </View>
      </View>
      {/* A button that says what it does (founder picked B, Nov 20 2026): the + looked like it opened the goal. */}
      {viewerIsOwner && !done
        ? (() => {
            const met = goal.kind === 'habit' && weekDone(goal).done;
            const word = goal.kind === 'best' ? 'Log a result' : goal.kind === 'total' ? 'Add 1' : met ? 'Logged' : 'Log';
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${word === 'Logged' ? 'Log another' : word}: ${goal.title}`}
                onPress={quick}
                hitSlop={6}
                style={({ pressed }) => [styles.log, met ? { backgroundColor: niche.accent, borderColor: niche.accent } : { borderColor: colors.text }, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
                {met ? <CheckIcon size={14} color="#FFFFFF" strokeWidth={2.8} /> : <PlusIcon size={14} color={colors.text} strokeWidth={2.6} />}
                <Text style={[styles.logText, { color: met ? '#FFFFFF' : colors.text }]}>{word}</Text>
              </Pressable>
            );
          })()
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { padding: 2, borderRadius: 13, borderWidth: 1.5, borderColor: 'transparent' },
  dot: { borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringText: { fontFamily: fonts.display, fontVariant: ['tabular-nums'] },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, color: colors.text },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
  log: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  logText: { fontSize: 13, fontWeight: '700' },
});
