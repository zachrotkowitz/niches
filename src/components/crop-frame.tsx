import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import { coverSize, MAX_ZOOM, type Framing } from '@/lib/photo-edit';
import type { PickedPhoto } from '@/lib/photos';

const SETTLE = { duration: 220, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System };

/**
 * The first screen's photo, as a frame you can pinch to zoom and drag to
 * move (founder's option A, Nov 17 2026, like Instagram). Grid lines show
 * while a finger is down. Let go past an edge and it eases back so the frame
 * is always full. The corner button switches between the photo's own shape
 * and a square.
 */
export function CropFrame({ photo, width, height, framing, onChange }: { photo: PickedPhoto; width: number; height: number; framing: Framing; onChange: (f: Framing) => void }) {
  const base = coverSize(photo, width, height);
  const zoom = useSharedValue(framing.zoom);
  const x = useSharedValue(framing.x);
  const y = useSharedValue(framing.y);
  const grid = useSharedValue(0);
  const active = useSharedValue(0);
  const last = useSharedValue({ x: 0, y: 0 });
  const dims = useSharedValue({ fw: width, fh: height, bw: base.w, bh: base.h });

  // A new photo, frame size or shape starts from the framing we're given.
  useEffect(() => {
    dims.set({ fw: width, fh: height, bw: base.w, bh: base.h });
    zoom.set(framing.zoom);
    x.set(framing.x);
    y.set(framing.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.uri, width, height, framing.square]);

  const report = (f: { zoom: number; x: number; y: number }) => onChange({ ...framing, ...f });

  /** How far the photo can move each way at a given zoom without showing an edge. */
  const limits = (z: number) => {
    'worklet';
    const d = dims.get();
    return { mx: Math.max(0, (d.bw * z - d.fw) / 2), my: Math.max(0, (d.bh * z - d.fh) / 2) };
  };
  // Pinch and drag can run together, so both move the photo in small steps
  // that add up, and the frame settles once the last finger lifts.
  const settle = () => {
    'worklet';
    active.set(Math.max(0, active.get() - 1));
    if (active.get() > 0) return;
    const z = Math.min(MAX_ZOOM, Math.max(1, zoom.get()));
    const { mx, my } = limits(z);
    const nx = Math.min(mx, Math.max(-mx, x.get()));
    const ny = Math.min(my, Math.max(-my, y.get()));
    zoom.set(withTiming(z, SETTLE));
    x.set(withTiming(nx, SETTLE));
    y.set(withTiming(ny, SETTLE));
    grid.set(withDelay(250, withTiming(0, { duration: 300 })));
    scheduleOnRN(report, { zoom: z, x: nx, y: ny });
  };
  const begin = () => {
    'worklet';
    active.set(active.get() + 1);
    grid.set(withTiming(1, { duration: 120 }));
  };

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      begin();
    },
    onUpdate: (e) => {
      'worklet';
      // A little give past the limits, so it feels like it's stretching.
      const z = zoom.get();
      const step = z < 1 || z > MAX_ZOOM ? 1 + (e.scaleChange - 1) * 0.3 : e.scaleChange;
      zoom.set(z * step);
      // Zoom around the middle of the frame: the spot you're looking at stays put.
      x.set(x.get() * step);
      y.set(y.get() * step);
    },
    onDeactivate: () => {
      'worklet';
      settle();
    },
  });
  const pan = usePanGesture({
    maxPointers: 2,
    onActivate: (e) => {
      'worklet';
      begin();
      last.set({ x: e.translationX, y: e.translationY });
    },
    onUpdate: (e) => {
      'worklet';
      const prev = last.get();
      const dx = e.translationX - prev.x;
      const dy = e.translationY - prev.y;
      last.set({ x: e.translationX, y: e.translationY });
      const { mx, my } = limits(zoom.get());
      const nx = x.get() + dx;
      const ny = y.get() + dy;
      // Past an edge the photo moves at a third of your finger's speed.
      x.set(Math.abs(nx) > mx && Math.abs(nx) > Math.abs(x.get()) ? x.get() + dx * 0.3 : nx);
      y.set(Math.abs(ny) > my && Math.abs(ny) > Math.abs(y.get()) ? y.get() + dy * 0.3 : ny);
    },
    onDeactivate: () => {
      'worklet';
      settle();
    },
  });
  const gesture = useSimultaneousGestures(pinch, pan);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: zoom.get() }],
  }));
  const gridStyle = useAnimatedStyle(() => ({ opacity: grid.get() }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityHint="Pinch to zoom, drag to move it in the frame"
        style={{ width, height, overflow: 'hidden', backgroundColor: '#1F1A14' }}>
        <Animated.View style={[{ position: 'absolute', width: base.w, height: base.h, left: (width - base.w) / 2, top: (height - base.h) / 2 }, photoStyle]}>
          <Image source={{ uri: photo.uri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gridStyle]}>
          {[1, 2].map((i) => (
            <View key={`v${i}`} style={[styles.v, { left: (width * i) / 3 }]} />
          ))}
          {[1, 2].map((i) => (
            <View key={`h${i}`} style={[styles.h, { top: (height * i) / 3 }]} />
          ))}
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={framing.square ? 'Use the photo’s own shape' : 'Make it square'}
          onPress={() => onChange({ zoom: 1, x: 0, y: 0, square: !framing.square })}
          style={styles.shape}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d={framing.square ? 'M9 4H4v5M20 15v5h-5M15 4h5v5M4 15v5h5' : 'M4 9V4h5M20 15v5h-5'} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  v: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  h: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  shape: { position: 'absolute', left: 12, bottom: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(31,26,20,0.6)', alignItems: 'center', justifyContent: 'center' },
});
