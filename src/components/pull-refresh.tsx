import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ios = Platform.OS === 'ios';

/**
 * Pull down at the top to refresh (founder, Nov 2026), for screens that start
 * at the very top of the phone (Discover, its niche pages, Saved, Profile).
 * iPhone's own spinner sits behind the status bar there, so on iPhone ours
 * shows instead: a small white circle just under the status bar that fades in
 * as you pull. Android keeps its own spinner. Light vibration, about a second;
 * in the demo nothing new arrives, so it just re-reads what's on the phone.
 *
 * Give the scroll view `refreshControl` and `onScroll` (or pass your own
 * scroll offset as `y` if the screen already tracks it), and render `spinner`
 * after the scroll view.
 */
export function usePullRefresh(color: string, y?: SharedValue<number>) {
  const insets = useSafeAreaInsets();
  const own = useSharedValue(0);
  const offset = y ?? own;
  const [refreshing, setRefreshing] = useState(false);
  const onScroll = useAnimatedScrollHandler((e) => {
    own.set(e.contentOffset.y);
  });
  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 900);
  };
  const style = useAnimatedStyle(() => {
    const pull = -offset.get();
    return {
      opacity: refreshing ? 1 : interpolate(pull, [6, 40], [0, 1], 'clamp'),
      transform: [{ translateY: refreshing ? 0 : interpolate(pull, [0, 60], [-16, 0], 'clamp') }],
    };
  });
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ios ? 'transparent' : color} colors={[color]} progressBackgroundColor="#FFFFFF" progressViewOffset={insets.top} />
  );
  const spinner = ios ? (
    <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 6 }, style]}>
      <View style={styles.chip}>
        <ActivityIndicator color={color} />
      </View>
    </Animated.View>
  ) : null;
  return { refreshControl, onScroll, spinner };
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  chip: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#1F1A14', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
});
