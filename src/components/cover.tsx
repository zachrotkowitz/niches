import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { postPhoto } from '@/lib/demo-photos';
import type { CoverLayout } from '@/lib/cover';
import type { Post } from '@/lib/types';

const GAP = 2;

/**
 * Lays out up to three cells in one of the six cover layouts. Used for the
 * real cover (photos) and for the small layout pictures in the cover editor.
 */
export function CoverFrame({ layout, cell, gap = GAP, style }: { layout: CoverLayout; cell: (i: number) => React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  const box = (i: number, flex = 1) => (
    <View key={i} style={{ flex }}>
      {cell(i)}
    </View>
  );
  const stack = (a: number, b: number) => (
    <View key={`s${a}`} style={{ flex: 1, gap }}>
      {box(a)}
      {box(b)}
    </View>
  );
  let inner: React.ReactNode;
  let column = false;
  switch (layout) {
    case 'one':
      inner = box(0);
      break;
    case 'two-side':
      inner = [box(0), box(1)];
      break;
    case 'two-stack':
      column = true;
      inner = [box(0), box(1)];
      break;
    case 'three-left':
      inner = [box(0, 2), stack(1, 2)];
      break;
    case 'three-right':
      inner = [stack(1, 2), box(0, 2)];
      break;
    default:
      inner = [box(0), box(1), box(2)];
  }
  return <View style={[{ flexDirection: column ? 'column' : 'row', gap, overflow: 'hidden' }, style]}>{inner}</View>;
}

/** A profile cover made of the person's own photos. */
export function CoverCollage({ layout, posts, style, empty = '#E4DCCB' }: { layout: CoverLayout; posts: (Post | undefined)[]; style?: StyleProp<ViewStyle>; empty?: string }) {
  return (
    <CoverFrame
      layout={layout}
      style={style}
      cell={(i) => {
        const p = posts[i];
        const photo = p ? postPhoto(p) : undefined;
        return photo ? (
          <Image source={photo} contentFit="cover" style={[StyleSheet.absoluteFill, { backgroundColor: p?.mediaColor ?? empty }]} accessibilityElementsHidden importantForAccessibility="no" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: empty }]} />
        );
      }}
    />
  );
}
