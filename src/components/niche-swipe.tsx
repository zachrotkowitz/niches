import * as Haptics from 'expo-haptics';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SHOP_NICHES } from '@/lib/shop';
import { useStore } from '@/lib/store';
import { NICHE_ORDER, type NicheId } from '@/lib/theme';

/** True while a niche swipe is in progress (and briefly after), so taps under the finger are ignored. */
const SwipeGuard = createContext<{ current: boolean }>({ current: false });

/** Returns a check to call at the top of tap handlers inside swipeable pages. */
export function useSwipeBlocked() {
  const guard = useContext(SwipeGuard);
  return () => guard.current;
}

/**
 * Rows that scroll sideways on their own (the shop's shelves) mark touches that
 * start on them, so the page swipe leaves those alone.
 */
const SwipeExempt = createContext<SharedValue<boolean> | null>(null);
export function useSwipeExempt() {
  const exempt = useContext(SwipeExempt);
  return {
    onTouchStart: () => exempt?.set(true),
    onTouchEnd: () => exempt?.set(false),
    onTouchCancel: () => exempt?.set(false),
  };
}

const SNAP = { duration: 380, dampingRatio: 1, reduceMotion: ReduceMotion.System } as const;

/**
 * Page-turn swipe between niches: every niche's feed sits side by side, and
 * the row follows your finger 1:1, so mid-swipe you see half of each.
 * Release past a third of the screen, or flick, to land on the next niche.
 *
 * `position` is the row's x offset; it's shared with the header so its color
 * can blend between niches while you drag. Vertical scrolling and the chip row
 * still work: the pan only activates on clear horizontal movement.
 */
export function NichePager({ position, renderPage }: { position: SharedValue<number>; renderPage: (id: NicheId) => ReactNode }) {
  const { state, actions } = useStore();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const index = NICHE_ORDER.indexOf(state.niche);
  const last = NICHE_ORDER.length - 1;
  // In a niche's shop, swiping right goes back to that niche's feed; swiping
  // left still turns to the next niche (founder, Nov 21 2026).
  const inShop = state.homeMode === 'shop' && SHOP_NICHES.includes(state.niche);
  const shopMode = useSharedValue(inShop);
  useEffect(() => {
    shopMode.set(inShop);
  }, [inShop, shopMode]);
  const exempt = useSharedValue(false);
  const ignoring = useSharedValue(false);
  const exitShop = () => {
    actions.setHomeMode('feed');
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  const start = useSharedValue(0);
  const target = useSharedValue(index);
  const pageWidth = useSharedValue(width);
  // While a swipe is in progress the pages ignore taps, so letting go never opens or likes a post.
  const guard = useRef({ current: false }).current;
  const startDrag = () => {
    guard.current = true;
  };
  const endDrag = () => {
    setTimeout(() => {
      guard.current = false;
    }, 120);
  };

  // Tapping a niche chip (or any other niche change) slides the row to it.
  useEffect(() => {
    pageWidth.set(width);
    if (target.get() !== index) {
      target.set(index);
      position.set(withSpring(-index * width, SNAP));
    } else {
      position.set(-index * width);
    }
  }, [index, width, position, pageWidth, target]);

  const land = (i: number) => {
    const id = NICHE_ORDER[i];
    if (id && id !== state.niche) {
      actions.setNiche(id);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
    }
  };

  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      ignoring.set(exempt.get());
      start.set(position.get());
      if (!ignoring.get()) scheduleOnRN(startDrag);
    },
    onUpdate: (e) => {
      'worklet';
      if (ignoring.get()) return;
      if (shopMode.get() && e.translationX > 0) {
        // Swiping right in a shop: a little give under the finger, then let go to leave the shop.
        position.set(start.get() + e.translationX * 0.25);
        return;
      }
      const w = pageWidth.get();
      const min = -last * w;
      let x = start.get() + e.translationX;
      // Rubber-band past the first and last niche instead of a hard stop.
      if (x > 0) x = x * 0.25;
      if (x < min) x = min + (x - min) * 0.25;
      position.set(x);
    },
    onDeactivate: (e) => {
      'worklet';
      if (ignoring.get()) return;
      const w = pageWidth.get();
      const from = target.get();
      if (shopMode.get() && e.translationX > 0) {
        position.set(withSpring(-from * w, SNAP));
        if (!e.canceled && (e.translationX > w * 0.18 || e.velocityX > 450)) scheduleOnRN(exitShop);
        return;
      }
      const travelled = -(position.get() - -from * w) / w; // pages moved, + is forward
      let to = from;
      if (!e.canceled && (Math.abs(travelled) > 0.33 || Math.abs(e.velocityX) > 500)) {
        to = from + (e.velocityX < -500 || (Math.abs(e.velocityX) <= 500 && travelled > 0) ? 1 : -1);
      }
      to = Math.max(0, Math.min(last, to));
      target.set(to);
      position.set(withSpring(-to * w, { ...SNAP, velocity: e.velocityX }));
      if (to !== from) scheduleOnRN(land, to);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(endDrag);
    },
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.get() }] }));

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <SwipeGuard.Provider value={guard}>
      <SwipeExempt.Provider value={exempt}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1, flexDirection: 'row', width: width * NICHE_ORDER.length }, rowStyle]}>
          {NICHE_ORDER.map((id) => (
            <View key={id} style={{ width, flexShrink: 0, flexGrow: 0, height: '100%' }} accessibilityElementsHidden={id !== state.niche} importantForAccessibility={id === state.niche ? 'auto' : 'no-hide-descendants'}>
              {renderPage(id)}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
      </SwipeExempt.Provider>
      </SwipeGuard.Provider>
    </View>
  );
}
