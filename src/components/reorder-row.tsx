import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export type ReorderItem = {
  key: string;
  /** Read to screen readers, e.g. "Hand-cut tagliatelle". */
  label: string;
  render: () => ReactNode;
  onPress?: () => void;
};

const SPRING = { duration: 320, dampingRatio: 0.85, reduceMotion: ReduceMotion.System };
const HOLD_MS = 220;
const WEB = Platform.OS === 'web';

/**
 * A row of equal slots whose items you reorder by dragging: press and hold an
 * item until it lifts, slide it left or right (the others make room), let go.
 * A quick tap still opens it. Screen readers get "Move left/right" actions.
 * Slots past the items are filled by `renderEmpty` (like empty Top 4 spots).
 */
export function ReorderRow({
  items,
  slots,
  gap = 8,
  itemHeight,
  onReorder,
  renderEmpty,
}: {
  items: ReorderItem[];
  slots: number;
  gap?: number;
  /** Height of one item for a given slot width (items are laid out absolutely). */
  itemHeight: (slotWidth: number) => number;
  onReorder: (keys: string[]) => void;
  renderEmpty?: (index: number) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const slotW = width ? (width - gap * (slots - 1)) / slots : 0;
  const step = useSharedValue(0);
  useEffect(() => {
    step.set(slotW + gap);
  }, [slotW, gap, step]);
  // Where each item currently sits, by key. Lives on the UI thread while dragging.
  const order = useSharedValue<string[]>(items.map((i) => i.key));
  const keysSig = items.map((i) => i.key).join('|');
  useEffect(() => {
    order.set(items.map((i) => i.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSig]);

  const move = (key: string, by: number) => {
    const keys = items.map((i) => i.key);
    const from = keys.indexOf(key);
    const to = Math.max(0, Math.min(keys.length - 1, from + by));
    if (from === to) return;
    keys.splice(to, 0, keys.splice(from, 1)[0]);
    onReorder(keys);
  };

  const h = slotW ? itemHeight(slotW) : 0;
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: h || undefined, minHeight: 40 }}>
      {slotW
        ? Array.from({ length: slots }, (_, i) =>
            i >= items.length && renderEmpty ? (
              <View key={`empty-${i}`} style={{ position: 'absolute', left: i * (slotW + gap), top: 0, width: slotW, height: h }}>
                {renderEmpty(i)}
              </View>
            ) : null,
          )
        : null}
      {slotW
        ? items.map((item, i) => (
            <DraggableItem key={item.key} item={item} initialIndex={i} count={items.length} width={slotW} height={h} step={step} order={order} onDrop={onReorder} onMove={move} />
          ))
        : null}
    </View>
  );
}

function DraggableItem({
  item,
  initialIndex,
  count,
  width,
  height,
  step,
  order,
  onDrop,
  onMove,
}: {
  item: ReorderItem;
  initialIndex: number;
  count: number;
  width: number;
  height: number;
  step: SharedValue<number>;
  order: SharedValue<string[]>;
  onDrop: (keys: string[]) => void;
  onMove: (key: string, by: number) => void;
}) {
  const key = item.key;
  const x = useSharedValue(initialIndex * step.get());
  const startX = useSharedValue(0);
  const lifted = useSharedValue(0);
  const dragging = useSharedValue(false);
  const justDragged = useRef(false);

  // Follow the slot this item is in (when another item pushes it, or after a save).
  useEffect(() => {
    if (!dragging.get()) x.set(withSpring(initialIndex * step.get(), SPRING));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex, width]);

  const lift = () => {
    justDragged.current = true;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const tick = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };
  const settle = () => {
    setTimeout(() => (justDragged.current = false), 50);
  };

  const pan = usePanGesture({
    // Phones: hold, then drag (so scrolling still works). Web: a sideways drag starts it (mouse has no long press).
    activateAfterLongPress: WEB ? undefined : HOLD_MS,
    activeOffsetX: WEB ? [-8, 8] : undefined,
    failOffsetY: WEB ? [-10, 10] : undefined,
    onActivate: () => {
      'worklet';
      dragging.set(true);
      startX.set(x.get());
      lifted.set(withTiming(1, { duration: 140 }));
      scheduleOnRN(lift);
    },
    onUpdate: (e) => {
      'worklet';
      const s = step.get();
      const maxX = (count - 1) * s;
      const nx = Math.max(-s * 0.3, Math.min(maxX + s * 0.3, startX.get() + e.translationX));
      x.set(nx);
      const keys = order.get();
      const from = keys.indexOf(key);
      const to = Math.max(0, Math.min(count - 1, Math.round(nx / s)));
      if (from !== to && from >= 0) {
        const next = keys.slice();
        next.splice(to, 0, next.splice(from, 1)[0]);
        order.set(next);
        scheduleOnRN(tick);
      }
    },
    onDeactivate: () => {
      'worklet';
      const keys = order.get();
      x.set(withSpring(keys.indexOf(key) * step.get(), SPRING));
      lifted.set(withTiming(0, { duration: 180 }));
      dragging.set(false);
      scheduleOnRN(onDrop, keys);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(settle);
    },
  });

  // While another item is being dragged, slide to this item's new slot.
  useAnimatedReaction(
    () => order.get().indexOf(key),
    (i, prev) => {
      if (i !== prev && i >= 0 && !dragging.get()) x.set(withSpring(i * step.get(), SPRING));
    },
  );
  const style = useAnimatedStyle(() => {
    const l = lifted.get();
    return {
      transform: [{ translateX: x.get() }, { scale: 1 + l * 0.06 }],
      zIndex: dragging.get() ? 10 : 1,
      shadowOpacity: l * 0.22,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width, height, shadowColor: '#000', shadowRadius: 12, shadowOffset: { width: 0, height: 8 } }, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityHint="Hold and drag to change the order"
          accessibilityActions={[{ name: 'moveLeft', label: 'Move left' }, { name: 'moveRight', label: 'Move right' }]}
          onAccessibilityAction={(e) => onMove(key, e.nativeEvent.actionName === 'moveLeft' ? -1 : 1)}
          onPress={() => {
            if (!justDragged.current) item.onPress?.();
          }}
          style={{ flex: 1 }}>
          {item.render()}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
