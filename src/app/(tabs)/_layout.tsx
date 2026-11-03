import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { BookmarkIcon, HomeIcon, PersonIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { useStore } from '@/lib/store';
import { colors, NICHES } from '@/lib/theme';

export default function TabLayout() {
  const { state } = useStore();
  // The tab bar takes the color of the niche you're in.
  const accent = NICHES[state.niche].accent;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.hairline, backgroundColor: colors.ground },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <HomeIcon color={String(color)} filled={focused} /> }}
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
            <View style={{ width: 44, height: 34, borderRadius: 11, backgroundColor: focused ? accent : colors.text, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
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
