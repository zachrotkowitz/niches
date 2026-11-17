import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';

const tick = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

/**
 * A -100…100 slider for photo adjustments. Touch anywhere on the track to
 * jump there, drag to fine-tune; it clicks softly as it passes 0. Tap the
 * number to put it back to 0. Screen readers can swipe up and down to change it.
 */
export function AdjustSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const surface = useSurface();
  const [width, setWidth] = useState(0);
  const w = useSharedValue(0);
  const v = useSharedValue(value);
  const lastSent = useSharedValue(value);

  useEffect(() => {
    v.set(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const send = (n: number) => onChange(n);
  const fromX = (x: number) => {
    'worklet';
    const width = w.get();
    if (!width) return 0;
    return Math.round(Math.min(100, Math.max(-100, (x / width) * 200 - 100)));
  };
  const update = (x: number) => {
    'worklet';
    const n = fromX(x);
    if (n === lastSent.get()) return;
    if ((n === 0 || Math.sign(n) !== Math.sign(lastSent.get())) && lastSent.get() !== 0) scheduleOnRN(tick);
    lastSent.set(n);
    v.set(n);
    scheduleOnRN(send, n);
  };
  const pan = usePanGesture({
    minDistance: 0,
    onActivate: (e) => {
      'worklet';
      lastSent.set(v.get());
      update(e.x);
    },
    onUpdate: (e) => {
      'worklet';
      update(e.x);
    },
  });

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: ((v.get() + 100) / 200) * w.get() - 11 }] }));
  const fill = useAnimatedStyle(() => {
    const half = w.get() / 2;
    const len = (Math.abs(v.get()) / 100) * half;
    return { left: v.get() >= 0 ? half : half - len, width: len };
  });

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: -100, max: 100, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(-100, Math.min(100, value + (e.nativeEvent.actionName === 'increment' ? 10 : -10))))}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: value ? surface.text : surface.muted, fontWeight: value ? '700' : '500' }]}>{label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Reset ${label}`} disabled={!value} onPress={() => onChange(0)} hitSlop={10}>
          <Text style={[styles.value, { color: value ? surface.text : surface.muted }]}>{value > 0 ? `+${value}` : value}</Text>
        </Pressable>
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hit}
          onLayout={(e) => {
            setWidth(e.nativeEvent.layout.width);
            w.set(e.nativeEvent.layout.width);
          }}>
          <View style={[styles.track, { backgroundColor: surface.line }]} />
          {width ? (
            <>
              <View style={[styles.center, { left: width / 2 - 1, backgroundColor: surface.muted }]} />
              <Animated.View style={[styles.fill, { backgroundColor: surface.text }, fill]} />
              <Animated.View style={[styles.thumb, thumb]} />
            </>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  hit: { height: 36, justifyContent: 'center', marginHorizontal: 11 },
  track: { height: 3, borderRadius: 2 },
  center: { position: 'absolute', top: 12, width: 2, height: 12, borderRadius: 1 },
  fill: { position: 'absolute', height: 3, top: 16.5, borderRadius: 2 },
  thumb: { position: 'absolute', left: 0, top: 7, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', shadowColor: '#1F1A14', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
