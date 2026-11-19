import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';

const ITEM = 40;
const VISIBLE = 5; // rows showing; the middle one is the pick
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const HALVES = ['AM', 'PM'];

/** "7:30 PM" → its parts, or a 7:00 PM default. */
function parse(t?: string) {
  const m = t?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { h: '7', min: '00', half: 'PM' };
  return { h: String(Number(m[1])), min: m[2], half: m[3].toUpperCase() };
}

/**
 * One spinning column: scroll it and it snaps to a row; the row in the
 * middle band is the pick, in the niche's color. Tap a row to jump to it.
 * A soft click as each row passes the middle (phones).
 */
function Wheel({ items, value, onChange, accent, label, width }: { items: string[]; value: string; onChange: (v: string) => void; accent: string; label: string; width: number }) {
  const surface = useSurface();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const start = Math.max(0, items.indexOf(value));
  const [live, setLive] = useState(start);
  const liveRef = useRef(start);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start on the current value.
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: start * ITEM, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (i: number) => {
    const v = items[Math.min(items.length - 1, Math.max(0, i))];
    if (v !== value) onChange(v);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(items.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
    if (i !== liveRef.current) {
      liveRef.current = i;
      setLive(i);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
    }
    // The web has no "scroll ended" event, so settle a moment after the last scroll.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (Platform.OS === 'web') ref.current?.scrollTo({ y: liveRef.current * ITEM, animated: true });
      commit(liveRef.current);
    }, 140);
  };
  const jump = (i: number) => ref.current?.scrollTo({ y: i * ITEM, animated: true });

  return (
    <View style={{ width, height: ITEM * VISIBLE }}>
      <ScrollView
        ref={ref}
        accessibilityLabel={label}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => commit(Math.round(e.nativeEvent.contentOffset.y / ITEM))}
        contentContainerStyle={{ paddingVertical: ITEM * Math.floor(VISIBLE / 2) }}
        style={Platform.OS === 'web' ? ({ scrollSnapType: 'y mandatory' } as object) : undefined}>
        {items.map((it, i) => {
          const d = Math.abs(i - live);
          return (
            <Pressable
              key={it}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${it}`}
              accessibilityState={{ selected: i === live }}
              onPress={() => jump(i)}
              style={[styles.item, Platform.OS === 'web' ? ({ scrollSnapAlign: 'center' } as object) : null]}>
              <Text style={[styles.itemText, d === 0 ? { color: accent, fontSize: 26, fontWeight: '600' } : { color: surface.muted, opacity: d === 1 ? 0.9 : 0.45 }]}>{it}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Pick a time on spinning wheels, like the phone's own picker (founder, Nov
 * 19 2026, from a screenshot they liked): hours, minutes and AM / PM, no
 * seconds. Sits on a white card like the calendar; gives back "7:30 PM".
 */
export function TimePicker({ value, onChange, accent }: { value?: string; onChange: (t: string) => void; accent: string }) {
  const cur = parse(value);
  const set = (next: Partial<typeof cur>) => {
    const v = { ...cur, ...next };
    onChange(`${v.h}:${v.min} ${v.half}`);
  };
  return (
    <View style={styles.wrap}>
      {/* The band behind the middle row. */}
      <View pointerEvents="none" style={[styles.band, { backgroundColor: 'rgba(31,26,20,0.05)' }]} />
      <Wheel items={HOURS} value={cur.h} onChange={(h) => set({ h })} accent={accent} label="Hour" width={64} />
      <Text style={[styles.colon, { color: accent }]}>:</Text>
      <Wheel items={MINUTES} value={cur.min} onChange={(min) => set({ min })} accent={accent} label="Minutes" width={64} />
      <Wheel items={HALVES} value={cur.half} onChange={(half) => set({ half })} accent={accent} label="AM or PM" width={70} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  band: { position: 'absolute', left: 12, right: 12, top: 6 + ITEM * 2, height: ITEM, borderRadius: 12 },
  item: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 19, fontVariant: ['tabular-nums'] },
  colon: { fontSize: 24, fontWeight: '600', marginTop: -3 },
});
