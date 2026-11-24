import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSwipeExempt } from '@/components/niche-swipe';

/**
 * Several photos you swipe through sideways, with dots (founder, Nov 24 2026:
 * multiple photos on posts, like listings). Its own swipes never turn Home's
 * niche page.
 */
export function PhotoPager({ photos, height, label, onPress, onIndex }: { photos: ImageProps['source'][]; height: number; label: string; onPress?: () => void; onIndex?: (i: number) => void }) {
  const [width, setWidth] = useState(0);
  const [index, setIndexRaw] = useState(0);
  const setIndex = (i: number) => (setIndexRaw(i), onIndex?.(i));
  const exempt = useSwipeExempt();
  const settle = (x: number) => width && setIndex(Math.round(x / width));
  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.x)}
          onScroll={Platform.OS === 'web' ? (e) => settle(e.nativeEvent.contentOffset.x) : undefined}
          scrollEventThrottle={64}
          {...exempt}>
          {photos.map((src, i) => (
            <Pressable key={i} accessibilityRole="image" accessibilityLabel={`${label}, photo ${i + 1} of ${photos.length}`} onPress={onPress} style={{ width, height }}>
              <Image source={src} contentFit="cover" style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

/** Which photo you're on, shown under the photo in the niche's color (founder, Nov 24 2026: bottom, easy to read). */
export function PagerDots({ count, index, color }: { count: number; index: number; color: string }) {
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Photo ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: i === index ? color : `${color}40` }, i === index ? styles.dotOn : null]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { width: 22 },
});
