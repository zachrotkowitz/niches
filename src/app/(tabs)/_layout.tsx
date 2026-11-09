import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { BookmarkIcon, HomeIcon, PersonIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useNiches, useStore } from '@/lib/store';
import { BODY_FONTS } from '@/lib/theme';

export default function TabLayout() {
  const { state } = useStore();
  const NICHES = useNiches();
  // The tab bar takes the flood color of the niche you're in, on every tab,
  // so you always know which niche you're in.
  const niche = NICHES[state.niche];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: niche.ink,
        tabBarInactiveTintColor: niche.inkSoft,
        // Mixed-niche tabs (Discover, Post, Saved) use the pale tint; Home and Profile override with the flood.
        tabBarStyle: { borderTopColor: niche.line, backgroundColor: niche.field },
        sceneStyle: { backgroundColor: niche.field },
        tabBarLabelStyle: { fontSize: 10, fontFamily: BODY_FONTS['600'] },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarStyle: { borderTopColor: niche.line, backgroundColor: niche.mid }, tabBarIcon: ({ color, focused }) => <HomeIcon color={String(color)} filled={focused} /> }}
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
            <View style={{ width: 48, height: 36, borderRadius: 18, backgroundColor: focused ? niche.accent : niche.ink, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
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
        options={{ title: 'Profile', tabBarStyle: { borderTopColor: niche.line, backgroundColor: niche.mid }, tabBarIcon: ({ color, focused }) => <PersonIcon color={String(color)} filled={focused} /> }}
      />
    </Tabs>
  );
}
