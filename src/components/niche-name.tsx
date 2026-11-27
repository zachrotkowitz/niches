import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { fonts } from '@/lib/theme';

/**
 * A niche's name set big in script (the new look, founder Nov 26 2026): a
 * grand, oversized first letter in Great Vibes and the rest in Herr Von
 * Muellerhoff. Only for big niche titles; small mentions use the body font.
 * Short names ("Art") are all Great Vibes: Herr Von Muellerhoff's "rt" read
 * as "i" plus a squiggle (founder, Nov 27 2026).
 *
 * The big letter and the rest are two texts on one baseline, each at its
 * font's natural height (one squeezed line height cut off the top of the C).
 *
 * Script letters reach past their own slot (an "h" runs 0.28 of its size past
 * its right edge, a "g" 0.24 past its left), and on iPhone a text draws only
 * inside its letters' box: padding doesn't help, the edge letters get sliced
 * (founder's screenshots, Nov 27 2026). So each text carries invisible room
 * inside it: two Great Vibes spaces before, two spaces and a see-through dot
 * after (a dot so the trailing spaces aren't dropped), and negative margins of
 * exactly that width take it back out of the layout.
 */
export function NicheName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const first = name.slice(0, 1);
  const rest = name.slice(1);
  const short = rest.length <= 3;
  const capSize = Math.round(size * CAP_SCALE);
  // The rest tucks a little into the big letter so the strokes meet, like the approved mock.
  const join = -Math.round(size * 0.05);
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={name} style={[styles.row, style]}>
      <Text style={[styles.cap, room(capSize), { fontSize: capSize, color }]}>
        <Lead />
        {first}
        <Tail />
      </Text>
      <Text style={[short ? styles.cap : styles.rest, room(size, join), { fontSize: size, color }]}>
        <Lead />
        {rest}
        <Tail />
      </Text>
    </View>
  );
}

// Great Vibes widths, as a share of the font size (from the font file).
const SPACE = 0.17;
const DOT = 0.205;
const LEAD = 2 * SPACE;
const TAIL = 2 * SPACE + DOT;

function Lead() {
  return <Text style={styles.cap}>{'  '}</Text>;
}
function Tail() {
  return (
    <Text style={styles.cap}>
      {'  '}
      <Text style={styles.ghost}>.</Text>
    </Text>
  );
}
/** Negative margins that cancel the invisible room inside a text of this size. */
function room(n: number, extraLeft = 0) {
  return { marginLeft: -LEAD * n + extraLeft, marginRight: -TAIL * n };
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
  ghost: { color: 'transparent' },
});
