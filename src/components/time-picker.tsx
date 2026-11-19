import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { fonts } from '@/lib/theme';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '15', '30', '45'];
const tick = () => {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
};

/** "7:30 PM" → its parts, or a 7:00 PM default. */
function parse(t?: string) {
  const m = t?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { h: 7, min: '00', pm: true };
  return { h: Number(m[1]), min: MINUTES.includes(m[2]) ? m[2] : '00', pm: m[3].toUpperCase() === 'PM' };
}

/**
 * Pick any time with a few taps, nothing to scroll (founder, Nov 19 2026:
 * "like the calendar, an option to pick the time themselves"): the time in
 * big serif, then the hours, the minutes and AM / PM. Sits on a white card
 * like the calendar. Gives back times like "7:30 PM".
 */
export function TimePicker({ value, onChange, accent }: { value?: string; onChange: (t: string) => void; accent: string }) {
  const surface = useSurface();
  const { h, min, pm } = parse(value);
  const set = (next: Partial<{ h: number; min: string; pm: boolean }>) => {
    tick();
    const v = { h, min, pm, ...next };
    onChange(`${v.h}:${v.min} ${v.pm ? 'PM' : 'AM'}`);
  };
  const cell = (on: boolean) => [styles.cell, on ? { backgroundColor: accent } : null];
  const label = (on: boolean) => [styles.cellText, { color: on ? '#FFFFFF' : surface.text, fontWeight: on ? ('700' as const) : ('500' as const) }];

  return (
    <View style={styles.wrap}>
      <Text accessibilityLiveRegion="polite" style={[styles.big, { color: surface.text }]}>
        {h}:{min} {pm ? 'PM' : 'AM'}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Hour" style={styles.grid}>
        {HOURS.map((x) => (
          <Pressable key={x} accessibilityRole="radio" accessibilityState={{ checked: x === h }} accessibilityLabel={`${x} o’clock`} onPress={() => set({ h: x })} style={styles.slot}>
            <View style={cell(x === h)}>
              <Text style={label(x === h)}>{x}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={[styles.row, { borderTopColor: surface.line }]}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Minutes" style={styles.pair}>
          {MINUTES.map((x) => (
            <Pressable key={x} accessibilityRole="radio" accessibilityState={{ checked: x === min }} accessibilityLabel={`${x} minutes`} onPress={() => set({ min: x })}>
              <View style={[cell(x === min), styles.wide]}>
                <Text style={label(x === min)}>:{x}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel="AM or PM" style={styles.toggle}>
          {[false, true].map((p) => (
            <Pressable key={String(p)} accessibilityRole="radio" accessibilityState={{ checked: p === pm }} onPress={() => set({ pm: p })} style={[styles.toggleItem, p === pm && { backgroundColor: surface.text }]}>
              <Text style={[styles.toggleText, { color: p === pm ? '#FFFFFF' : surface.muted }]}>{p ? 'PM' : 'AM'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, gap: 6 },
  big: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { width: `${100 / 6}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  cell: { minWidth: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  wide: { minWidth: 46, paddingHorizontal: 6 },
  cellText: { fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 8 },
  pair: { flexDirection: 'row', gap: 2 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(31,26,20,0.07)' },
  toggleItem: { minHeight: 34, paddingHorizontal: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 13, fontWeight: '700' },
});
