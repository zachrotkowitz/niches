import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Avatar } from '@/components/primitives';
import { Text } from '@/components/text';
import { useAppGround } from '@/lib/store';
import { fonts, TOUCH } from '@/lib/theme';
import type { User } from '@/lib/types';

/** Where the small profile picture sits on screen, so the big one can grow out of it. */
export type PhotoOrigin = { x: number; y: number; size: number };

const MOVE = { duration: 320, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };

/**
 * Tap someone's profile picture to see it up close. The circle glides from
 * where it was to the middle of the screen and grows, on the cream app
 * background; nothing bounces or zooms in from nowhere (founder, Nov 2026).
 * Tap anywhere or Close and it glides back.
 */
export function PhotoViewer({ user, origin, onClose, onChange }: { user: User; origin: PhotoOrigin | null; onClose: () => void; onChange?: () => void }) {
  const ground = useAppGround();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 64, height * 0.5, 420);
  // Where the big circle rests: centered, a little above the middle to leave room for the name.
  const restX = (width - size) / 2;
  const restY = Math.max(insets.top + 60, (height - size) / 2 - 60);
  const t = useSharedValue(0);
  // The small picture's position lives in shared values, set once before the
  // animation starts. Reading it from props instead let a re-render mid-way
  // (or the reset when closing) snap the circle to full size for a frame.
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  const fs = useSharedValue(size);
  const visible = !!origin;

  useEffect(() => {
    if (!origin) return;
    fx.set(origin.x);
    fy.set(origin.y);
    fs.set(origin.size);
    t.set(0);
    t.set(withTiming(1, MOVE));
    // Only when it opens; later re-renders must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => {
    t.set(withTiming(0, { ...MOVE, duration: 260 }, (done) => done && scheduleOnRN(onClose)));
  };

  const circle = useAnimatedStyle(() => {
    const p = t.get();
    const start = fs.get() / size;
    const s = start + (1 - start) * p;
    // Move the circle's center from the small picture's center to the resting spot.
    const dx = (fx.get() + fs.get() / 2 - (restX + size / 2)) * (1 - p);
    const dy = (fy.get() + fs.get() / 2 - (restY + size / 2)) * (1 - p);
    return { opacity: p > 0 ? 1 : 0, transform: [{ translateX: dx }, { translateY: dy }, { scale: s }] };
  });
  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(1, t.get() * 1.6) }));
  const details = useAnimatedStyle(() => ({ opacity: Math.max(0, (t.get() - 0.6) / 0.4) }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: ground.ground }, backdrop]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={close} style={StyleSheet.absoluteFill} />

      <Animated.View pointerEvents="none" style={[styles.circle, { left: restX, top: restY, width: size, height: size }, circle]}>
        <View accessibilityRole="image" accessibilityLabel={`${user.displayName}’s profile photo`}>
          <Avatar user={user} size={size} />
        </View>
      </Animated.View>

      <Animated.View pointerEvents="box-none" style={[styles.details, { top: restY + size + 24 }, details]}>
        <Text style={[styles.name, { color: ground.text }]}>{user.displayName}</Text>
        <Text style={[styles.handle, { color: ground.muted }]}>{user.username}</Text>
        {onChange ? (
          <Pressable accessibilityRole="button" onPress={onChange} hitSlop={6} style={styles.change}>
            <Text style={[styles.changeText, { color: ground.text }]}>{user.avatarUri ? 'Change photo' : 'Add a photo'}</Text>
          </Pressable>
        ) : null}
      </Animated.View>

      <Animated.View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }, details]}>
        <Pressable accessibilityRole="button" onPress={close} hitSlop={8} style={styles.close}>
          <Text style={[styles.closeText, { color: ground.text }]}>Close</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute' },
  details: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  top: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 16 },
  close: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
  closeText: { fontSize: 16, fontWeight: '700' },
  name: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42 },
  handle: { fontSize: 15, marginTop: 2 },
  change: { minHeight: TOUCH, justifyContent: 'center', marginTop: 8 },
  changeText: { fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
});
