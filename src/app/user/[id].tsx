import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { ProfileView } from '@/components/profile-view';
import { useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

/** Someone else's profile. */
export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById } = useStore();
  const user = usersById[id];
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/discover'));

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        {user ? <Text style={styles.title}>{user.username}</Text> : null}
        <View style={{ width: 80 }} />
      </View>
      {user ? (
        <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 40 }}>
          <ProfileView user={user} isMe={user.id === state.me?.id} />
        </ScrollView>
      ) : (
        <View style={{ padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 17, color: colors.text }}>This account isn’t available.</Text>
          <Button label="Go back" onPress={goBack} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  back: { minHeight: TOUCH, minWidth: 80, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 17, color: colors.text },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
});
