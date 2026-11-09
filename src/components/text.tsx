import { createContext, useContext } from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { BODY_FONTS } from '@/lib/theme';

// Nested Text inherits its parent's font unless it sets its own weight.
const InsideText = createContext(false);

/**
 * Text in Schibsted Grotesk. Custom fonts ship one file per weight, so the
 * fontWeight in a style picks the matching file (and the synthetic weight is
 * turned off so it isn't bolded twice). An explicit fontFamily wins.
 */
export function Text({ style, children, ...rest }: TextProps) {
  const nested = useContext(InsideText);
  const flat = StyleSheet.flatten(style) ?? {};
  let extra = null;
  if (!flat.fontFamily && (!nested || flat.fontWeight !== undefined)) {
    const w = flat.fontWeight === 'bold' ? '700' : flat.fontWeight === 'normal' || flat.fontWeight === undefined ? '400' : String(flat.fontWeight);
    extra = { fontFamily: BODY_FONTS[w] ?? BODY_FONTS['400'], fontWeight: 'normal' as const };
  }
  return (
    <RNText {...rest} style={extra ? [style, extra] : style}>
      {nested ? children : <InsideText.Provider value>{children}</InsideText.Provider>}
    </RNText>
  );
}
