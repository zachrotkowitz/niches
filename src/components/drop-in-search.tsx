import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { SearchIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { fonts } from '@/lib/theme';

/**
 * A search bar that drops in from the top when you scroll back up a little,
 * once the page's own search bar has scrolled out of sight (founder, Nov 2026).
 * Scrolling down tucks it away again. Used on Discover and its niche pages.
 *
 * Pass `onScroll` to an Animated.ScrollView (with scrollEventThrottle 16) and
 * render `DropInSearch` after it.
 */
export function useDropInSearch(hideAfter: number) {
  const lastY = useSharedValue(0);
  /** The page's scroll offset, shared with the pull-to-refresh spinner. */
  const y = useSharedValue(0);
  const target = useSharedValue(0);
  const shown = useSharedValue(0);
  const [on, setOn] = useState(false);
  const onScroll = useAnimatedScrollHandler((e) => {
    const top = e.contentOffset.y;
    y.set(top);
    const dy = top - lastY.get();
    lastY.set(top);
    let next = target.get();
    if (top < hideAfter) next = 0;
    else if (dy < -6) next = 1;
    else if (dy > 6) next = 0;
    if (next !== target.get()) {
      target.set(next);
      shown.set(withTiming(next, { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
      scheduleOnRN(setOn, next === 1);
    }
  });
  const style = useAnimatedStyle(() => ({ opacity: shown.get(), transform: [{ translateY: (shown.get() - 1) * 24 }] }));
  const hide = () => {
    target.set(0);
    shown.set(0);
    setOn(false);
  };
  return { onScroll, style, on, hide, y };
}

export function DropInSearch({ drop, placeholder, onPress }: { drop: ReturnType<typeof useDropInSearch>; placeholder: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  return (
    <Animated.View pointerEvents={drop.on ? 'auto' : 'none'} style={[styles.wrap, { paddingTop: insets.top + 6, backgroundColor: surface.ground, borderBottomColor: surface.line }, drop.style]}>
      <Pressable accessibilityRole="search" accessibilityLabel={placeholder.replace('…', '')} onPress={onPress} style={({ pressed }) => [styles.bar, { opacity: pressed ? 0.85 : 1 }]}>
        <SearchIcon size={18} color={surface.text} />
        <Text style={[styles.text, { color: surface.muted }]} numberOfLines={1}>{placeholder}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  bar: { height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(31,26,20,0.10)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  text: { flex: 1, fontFamily: fonts.displayItalic, fontSize: 19 },
});
