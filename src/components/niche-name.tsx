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
 * Herr Von Muellerhoff's "t" reads as an "i" and its "r" as a squiggle ("Art"
 * looked like "Ari"), so lowercase r and t are drawn in Great Vibes instead
 * (founder, Nov 27 2026).
 */
export function NicheName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const first = name.slice(0, 1);
  const rest = name.slice(1).split(/([rt])/).filter(Boolean);
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={name} style={[styles.row, style]}>
      <Text style={[styles.cap, { fontSize: Math.round(size * CAP_SCALE), color, marginRight: 1 }]}>{first}</Text>
      <Text style={[styles.rest, { fontSize: size, color }]}>
        {rest.map((part, i) => (part === 't' || part === 'r' ? <Text key={i} style={styles.cap}>{part}</Text> : part))}
      </Text>
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
