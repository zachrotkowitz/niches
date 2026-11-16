import { Stack } from 'expo-router';

import { useAppGround } from '@/lib/store';

/**
 * Discover is a small stack inside its tab, so niche pages opened from
 * "Explore by niche" keep the floating tab bar (founder, Nov 2026).
 */
export default function DiscoverLayout() {
  const ground = useAppGround();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ground.ground } }} />;
}
