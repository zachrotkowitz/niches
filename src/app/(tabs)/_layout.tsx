import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { BookmarkIcon, HomeIcon, PersonIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { BODY_FONTS } from '@/lib/theme';

export default function TabLayout() {
  const { state } = useStore();
  const NICHES = useNiches();
  // Home's tab bar takes the niche's flood color; every other tab uses the app background.
  const niche = NICHES[state.niche];
  const ground = useAppGround();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ground.text,
        tabBarInactiveTintColor: ground.muted,
        tabBarStyle: { borderTopColor: ground.line, backgroundColor: ground.ground },
        sceneStyle: { backgroundColor: ground.ground },
        tabBarLabelStyle: { fontSize: 10, fontFamily: BODY_FONTS['600'] },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarStyle: { borderTopColor: niche.line, backgroundColor: niche.mid }, tabBarActiveTintColor: niche.ink, tabBarInactiveTintColor: niche.inkSoft, tabBarIcon: ({ color, focused }) => <HomeIcon color={String(color)} filled={focused} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: ({ color, focused }) => <SearchIcon color={String(color)} filled={focused} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Post',
          tabBarAccessibilityLabel: 'Create a post',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 48, height: 36, borderRadius: 18, backgroundColor: ground.text, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <PlusIcon />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: 'Saved', tabBarIcon: ({ color, focused }) => <BookmarkIcon color={String(color)} filled={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <PersonIcon color={String(color)} filled={focused} /> }}
      />
    </Tabs>
  );
}
