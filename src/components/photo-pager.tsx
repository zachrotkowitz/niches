import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSwipeExempt } from '@/components/niche-swipe';

/**
 * Several photos you swipe through sideways, with dots (founder, Nov 24 2026:
 * multiple photos on posts, like listings). Its own swipes never turn Home's
 * niche page.
 */
export function PhotoPager({ photos, height, label, onPress }: { photos: ImageProps['source'][]; height: number; label: string; onPress?: () => void }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
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
      <View style={styles.dots} pointerEvents="none">
        {photos.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotOn : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 16, backgroundColor: '#FFFFFF' },
});
