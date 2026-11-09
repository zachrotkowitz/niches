import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { NICHE_BORDER } from '@/components/feed-grid';
import { CheckIcon, LockIcon } from '@/components/icons';
import { goalRule, progress, streak, weekStrip, type Goal, type WeekCell } from '@/lib/goals';
import { useNiches } from '@/lib/store';
import { colors } from '@/lib/theme';

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

/** A goal in a list. Goals from different niches sit together, so each card gets its niche border. */
export function GoalCard({ goal, viewerIsOwner = true }: { goal: Goal; viewerIsOwner?: boolean }) {
  const router = useRouter();
  const niche = useNiches()[goal.niche];
  const p = progress(goal);
  const s = goal.kind === 'habit' ? streak(goal) : 0;
  const hidden = !viewerIsOwner && goal.hideNumbers;
  const done = !!goal.doneAt;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${niche.label} goal: ${goal.title}. ${done ? 'Done.' : hidden ? '' : `${p.headline} ${p.caption}.`}${s > 1 && !hidden ? ` ${s} week streak.` : ''}`}
      onPress={() => router.push({ pathname: '/goals/[id]', params: { id: goal.id } })}
      style={({ pressed }) => [styles.card, { borderColor: niche.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={styles.top}>
        <Text style={[styles.rule, { color: niche.ink }]}>{done ? 'Done' : goalRule(goal)}</Text>
        {viewerIsOwner && goal.visibility === 'private' ? <LockIcon size={13} color={colors.textMuted} /> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>{goal.title}</Text>
      {goal.kind === 'habit' && !done ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          <WeekStrip goal={goal} weeks={8} color={niche.accent} field={niche.field} />
          {hidden ? null : (
            <Text style={styles.meta}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{p.headline}</Text> {p.caption}
              {s > 1 ? ` · ${s}-week streak` : ''}
            </Text>
          )}
        </View>
      ) : (
        <View style={{ gap: 8, marginTop: 6 }}>
          <ProgressBar fraction={done ? 1 : p.fraction} color={niche.accent} />
          {hidden ? null : (
            <Text style={styles.meta}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{p.headline}</Text> {p.caption}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { padding: 2, borderRadius: 13, borderWidth: 1.5, borderColor: 'transparent' },
  dot: { borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 18, borderWidth: NICHE_BORDER, backgroundColor: '#FFFFFF', padding: 14, gap: 3 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rule: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 21 },
  meta: { fontSize: 13, color: colors.textMuted },
});
