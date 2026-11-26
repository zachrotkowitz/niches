import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { fonts } from '@/lib/theme';

/**
 * A niche's name set big in script (the new look, founder Nov 26 2026): a
 * grand, oversized first letter in Great Vibes and the rest in Herr Von
 * Muellerhoff. Only for big niche titles; small mentions use the body font.
 */
export function NicheName({ name, size, color, style }: { name: string; size: number; color: string; style?: StyleProp<TextStyle> }) {
  const first = name.slice(0, 1);
  const rest = name.slice(1);
  return (
    <Text accessibilityRole="header" numberOfLines={1} style={[styles.rest, { fontSize: size, lineHeight: Math.round(size * 1.45), color }, style]}>
      <Text style={[styles.cap, { fontSize: Math.round(size * 1.45), letterSpacing: -size * 0.05 }]}>{first}</Text>
      {rest}
    </Text>
  );
}

/** Roughly how wide each letter of the script runs, as a share of the font size. */
export const SCRIPT_EM = 0.38;

const styles = StyleSheet.create({
  rest: { fontFamily: fonts.script },
  cap: { fontFamily: fonts.scriptCap },
});
