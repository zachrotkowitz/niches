import { SceneStyleInterpolators, Tabs } from 'expo-router/js-tabs';
import { Easing } from 'react-native';

import { FloatingTabBar } from '@/components/tab-bar';
import { useAppGround } from '@/lib/store';

export default function TabLayout() {
  const ground = useAppGround();
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ground.ground },
        // Tabs cross-fade like the shop and the feed do (founder, Nov 21 2026).
        animation: 'fade',
        sceneStyleInterpolator: SceneStyleInterpolators.forFade,
        transitionSpec: { animation: 'timing', config: { duration: 220, easing: Easing.out(Easing.quad) } },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="create" options={{ title: 'Post' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
