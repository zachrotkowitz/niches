import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { fonts } from '@/lib/theme';

/**
 * A niche's name set big in script (the new look, founder Nov 26 2026): a
 * grand, oversized first letter in Great Vibes and the rest in Herr Von
 * Muellerhoff. Only for big niche titles; small mentions use the body font.
 *
 * The big letter and the rest are two separate texts sitting on one baseline,
 * each at its font's natural height. Squeezing both sizes into one line height
 * cut off the top of the big letter on iPhone (founder, Nov 27 2026).
 *
 * Script letters reach past the edges of their own text box (the loop of an
 * "o", the tail of a "g" or "y"), and iPhone cuts off anything outside the box.
 * So each text gets extra room on every side (`pad`), taken back with negative
 * margins so the layout doesn't move (founder's screenshots, Nov 27 2026).
 *
 * Short names ("Art") are drawn all in Great Vibes: Herr Von Muellerhoff's
 * "rt" read as "i" plus a squiggle. Longer names keep Herr Von Muellerhoff
 * whole, so its letters stay joined (swapping single letters broke the joins).
 */
export function NicheName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const first = name.slice(0, 1);
  const rest = name.slice(1);
  const short = rest.length <= 3;
  const capSize = Math.round(size * CAP_SCALE);
  const pad = (n: number) => {
    const p = Math.ceil(n * 0.35);
    return { paddingHorizontal: p, marginHorizontal: -p, paddingVertical: Math.ceil(n * 0.12), marginVertical: -Math.ceil(n * 0.12) };
  };
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={name} style={[styles.row, style]}>
      <Text style={[styles.cap, pad(capSize), { fontSize: capSize, color }]}>{first}</Text>
      <Text style={[short ? styles.cap : styles.rest, pad(size), { fontSize: size, color, marginLeft: -Math.ceil(size * 0.35) + (short ? -Math.round(size * 0.04) : 1) }]}>{rest}</Text>
    </View>
  );
}

/** How much bigger the first letter is than the rest. */
export const CAP_SCALE = 1.45;
/** Roughly how wide each letter of the script runs, as a share of the font size. */
export const SCRIPT_EM = 0.38;
/**
 * How tall a NicheName of this size stands: the big letter's rise above the
 * baseline (Great Vibes' ascent is 0.85 of its size) plus the rest's fall
 * below it (Herr Von Muellerhoff's descent is 0.5).
 */
export function nicheNameHeight(size: number) {
  return Math.ceil(0.86 * size * CAP_SCALE + 0.5 * size);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  rest: { fontFamily: fonts.script },
  cap: { fontFamily: fonts.scriptCap },
});
