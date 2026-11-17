import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';

export type TabItem = { key: string; label: string; accessibilityLabel?: string; /** Underline color when selected (a niche's color). Defaults to the text color. */ color?: string };

type Box = { x: number; y: number; width: number; height: number };

const SLIDE = { duration: 260, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };

/**
 * One line that glides under whichever word is selected (founder, Nov 2026:
 * "slide left and right rather than a hard change"). Each word reports where
 * it sits with `onItemLayout(key)`; the line moves, stretches and changes
 * color to match. The first time it just appears in place.
 */
export function useSlidingLine(selected: string, color: string, { thickness = 2.5, pad = 0 }: { thickness?: number; pad?: number } = {}) {
  const boxes = useRef<Record<string, Box>>({});
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const w = useSharedValue(0);
  const tint = useSharedValue(color);
  const [placed, setPlaced] = useState(false);
  const first = useRef(true);

  const move = (box: Box | undefined) => {
    if (!box) return;
    const top = box.y + box.height - thickness;
    if (first.current) {
      x.set(box.x);
      y.set(top);
      w.set(box.width);
      tint.set(color);
      first.current = false;
      setPlaced(true);
    } else {
      x.set(withTiming(box.x, SLIDE));
      y.set(withTiming(top, SLIDE));
      w.set(withTiming(box.width, SLIDE));
      tint.set(withTiming(color, SLIDE));
    }
  };

  // Follow the selection (and its color) whenever they change.
  const last = useRef({ selected, color });
  if (last.current.selected !== selected || last.current.color !== color) {
    last.current = { selected, color };
    move(boxes.current[selected]);
  }

  const onItemLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x: bx, y: by, width, height } = e.nativeEvent.layout;
    // `pad` trims the touch padding so the line is as wide as the word.
    boxes.current[key] = { x: bx + pad, y: by, width: width - pad * 2, height };
    if (key === last.current.selected) move(boxes.current[key]);
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
    width: w.get(),
    backgroundColor: tint.get(),
  }));

  const line = <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, height: thickness, borderRadius: 2, opacity: placed ? 1 : 0 }, style]} />;
  return { onItemLayout, line };
}

/**
 * "Quiet tabs" (founder's pick over pill chips, Nov 2026): plain words in a
 * row, the selected one bold with a line under it, a hairline under the row.
 * Used for Discover topics, search result types, the niche filters on Saved
 * and the Post tab. The line slides between words.
 */
export function UnderlineTabs({ items, value, onChange, label, inset = 12 }: { items: TabItem[]; value: string; onChange: (key: string) => void; label: string; inset?: number }) {
  const surface = useSurface();
  const current = items.find((i) => i.key === value);
  const { onItemLayout, line } = useSlidingLine(value, current?.color ?? surface.text, { pad: 10 });
  return (
    <View style={[styles.wrap, { borderBottomColor: surface.line }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={label} contentContainerStyle={{ paddingHorizontal: inset }}>
        {items.map((item) => {
          const on = item.key === value;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              onPress={() => onChange(item.key)}
              onLayout={onItemLayout(item.key)}
              style={styles.tab}>
              <Text style={[styles.text, { color: on ? surface.text : surface.muted, fontWeight: on ? '700' : '500' }]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        {line}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  tab: { minHeight: 46, paddingHorizontal: 10, justifyContent: 'flex-end' },
  text: { fontSize: 15, paddingBottom: 12.5 },
});
