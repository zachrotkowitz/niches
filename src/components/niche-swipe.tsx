import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useStore } from '@/lib/store';
import { NICHE_ORDER } from '@/lib/theme';

/**
 * Swipe left/right on the Home feed to move to the next or previous niche.
 * The feed follows your finger; a quarter-screen drag or a flick commits.
 * Vertical scrolling and the chip row keep working: the pan only activates
 * after clear horizontal movement and fails on vertical movement.
 */
export function NicheSwipe({ children }: { children: ReactNode }) {
  const { state, actions } = useStore();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);

  const index = NICHE_ORDER.indexOf(state.niche);
  const hasPrev = index > 0;
  const hasNext = index < NICHE_ORDER.length - 1;

  const go = (dir: 1 | -1) => {
    const next = NICHE_ORDER[index + dir];
    if (!next) return;
    actions.setNiche(next);
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  const pan = usePanGesture({
    activeOffsetX: [-18, 18],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      const blocked = (e.translationX > 0 && !hasPrev) || (e.translationX < 0 && !hasNext);
      // Rubber-band at the first and last niche instead of a hard stop.
      tx.set(e.translationX * (blocked ? 0.15 : reduced ? 0.2 : 0.55));
    },
    onDeactivate: (e) => {
      'worklet';
      const dir = e.translationX < 0 ? 1 : -1;
      const allowed = dir === 1 ? hasNext : hasPrev;
      const commit = allowed && !e.canceled && (Math.abs(e.translationX) > width * 0.25 || Math.abs(e.velocityX) > 600);
      if (commit) {
        // The new niche's feed mounts in place; its fade-in covers the switch.
        tx.set(0);
        scheduleOnRN(go, dir);
      } else {
        tx.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: e.velocityX, reduceMotion: ReduceMotion.System }));
      }
    },
  });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.get() }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}
