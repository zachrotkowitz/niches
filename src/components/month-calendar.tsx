import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { isoDay, parseDay } from '@/lib/plans';
import { fonts, TOUCH } from '@/lib/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A month at a time to pick any day (founder, Nov 19 2026: "ultimate
 * flexibility"). Arrows move between months; days outside `min`/`max` are
 * faded and can't be picked. The chosen day is a filled circle, today has a ring.
 */
export function MonthCalendar({ value, onChange, min, max, accent }: { value: string; onChange: (iso: string) => void; min?: string; max?: string; accent: string }) {
  const surface = useSurface();
  const today = isoDay();
  const [month, setMonth] = useState(value.slice(0, 7));
  const [y, m] = month.split('-').map(Number);
  const daysIn = new Date(y, m, 0).getDate();
  const lead = new Date(y, m - 1, 1).getDay();
  const step = (d: number) => {
    const n = new Date(y, m - 1 + d, 1);
    setMonth(`${n.getFullYear()}-${pad(n.getMonth() + 1)}`);
  };
  const canBack = !min || month > min.slice(0, 7);
  const canNext = !max || month < max.slice(0, 7);
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.monthName, { color: surface.text }]}>{y === new Date().getFullYear() ? MONTHS[m - 1] : `${MONTHS[m - 1]} ${y}`}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canBack} onPress={() => step(-1)} style={[styles.arrow, { opacity: canBack ? 1 : 0.3 }]}>
            <ChevronLeftIcon size={20} color={surface.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={!canNext} onPress={() => step(1)} style={[styles.arrow, { opacity: canNext ? 1 : 0.3 }]}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <ChevronLeftIcon size={20} color={surface.text} />
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[styles.dow, { color: surface.muted }]}>{d}</Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.slot} />;
          const iso = `${month}-${pad(d)}`;
          const off = (!!min && iso < min) || (!!max && iso > max);
          const on = iso === value;
          return (
            <View key={iso} style={styles.slot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={parseDay(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                accessibilityState={{ selected: on, disabled: off }}
                disabled={off}
                onPress={() => {
                  if (Platform.OS !== 'web') void Haptics.selectionAsync();
                  onChange(iso);
                }}
                style={({ pressed }) => [
                  styles.day,
                  on ? { backgroundColor: accent } : iso === today ? { borderWidth: 1.5, borderColor: surface.text } : null,
                  { opacity: off ? 0.3 : pressed ? 0.7 : 1 },
                ]}>
                <Text style={[styles.dayNum, { color: on ? '#FFFFFF' : surface.text, fontWeight: on || iso === today ? '700' : '500' }]}>{d}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthName: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 30 },
  arrow: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '800', marginBottom: 2 },
  slot: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 15 },
});
