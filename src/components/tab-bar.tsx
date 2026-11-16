import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router/js-tabs';

import { BookmarkIcon, HomeIcon, PersonIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useAppGround, useNiches, useStore } from '@/lib/store';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Space to leave at the bottom of tab screens so content can scroll clear of the floating bar. */
export const TAB_BAR_SPACE = 112;

const LABELS: Record<string, string> = { index: 'Home', discover: 'Discover', create: 'Create a post', saved: 'Saved', profile: 'Profile' };

/**
 * The floating tab bar (founder's pick, Nov 2026): a white rounded bar with
 * icons only, hovering over every tab. The plus button takes the niche's ink
 * on Home and the app's ink everywhere else.
 */
export function FloatingTabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { state: app } = useStore();
  const niche = useNiches()[app.niche];
  const ground = useAppGround();
  const onHome = state.routes[state.index]?.name === 'index';
  const ink = onHome ? niche.ink : ground.text;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 6 }]}>
      <View accessibilityRole="tablist" style={[styles.bar, { shadowColor: ink }]}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const color = focused ? ink : '#655B4F';
          const onPress = () => navigateToTab(route.key);
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={LABELS[route.name] ?? route.name}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
              {route.name === 'create' ? (
                <View style={[styles.plus, { backgroundColor: ink }]}>
                  <PlusIcon size={22} />
                </View>
              ) : route.name === 'index' ? (
                <HomeIcon color={color} filled={focused} />
              ) : route.name === 'discover' ? (
                <SearchIcon color={color} filled={focused} />
              ) : route.name === 'saved' ? (
                <BookmarkIcon color={color} filled={focused} />
              ) : (
                <PersonIcon color={color} filled={focused} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: { width: '100%', maxWidth: 420, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  tab: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  plus: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
