import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/text';
import { NICHE_NAME_PATHS } from '@/lib/niche-name-paths';
import { fonts } from '@/lib/theme';

/**
 * A niche's name set big in script (the new look, founder Nov 26 2026): a
 * grand, oversized first letter in Great Vibes and the rest in Herr Von
 * Muellerhoff ("Art" all in Great Vibes: Herr's "rt" read as "Ari"). Only for
 * big niche titles; small mentions use the body font.
 *
 * The names are drawn as vector outlines copied from the two font files
 * (`src/lib/niche-name-paths.ts`, made by `scripts/niche-names.py`), not as
 * live text: on iPhone, live text in these script fonts had letters sliced at
 * their edges and joins broken however it was padded (founder's screenshots,
 * Nov 27 2026). Outlines can't be clipped, and the join between the big
 * letter and the rest is placed by hand per name. A name without outlines
 * (a niche added later, before the script is re-run) falls back to live text.
 */
export function NicheName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const shape = NICHE_NAME_PATHS[name];
  if (!shape) return <LiveName name={name} size={size} color={color} style={style} />;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={name} style={style}>
      <Svg width={shape.w * size} height={shape.h * size} viewBox={`${shape.x} ${shape.y} ${shape.w} ${shape.h}`}>
        <Path d={shape.d} fill={color} />
      </Svg>
    </View>
  );
}

/** How wide a name runs, as a share of its size, so screens can pick a size that fits. */
export function nicheNameWidth(name: string) {
  return NICHE_NAME_PATHS[name]?.w ?? name.length * 0.38;
}

/** How much bigger the first letter is than the rest. */
export const CAP_SCALE = 1.45;

function LiveName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={name} style={[styles.row, style]}>
      <Text style={[styles.cap, { fontSize: Math.round(size * CAP_SCALE), color }]}>{name.slice(0, 1)}</Text>
      <Text style={[styles.rest, { fontSize: size, color }]}>{name.slice(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  rest: { fontFamily: fonts.script },
  cap: { fontFamily: fonts.scriptCap },
});
