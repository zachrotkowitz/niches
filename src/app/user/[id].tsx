import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { ProfileView } from '@/components/profile-view';
import { SurfaceProvider, useSurface, useSurfaceStyles } from '@/components/surface';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { groundSurface, TOUCH, type Surface } from '@/lib/theme';

/** Someone else's profile. */
function UserScreenInner() {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
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
          <ChevronLeftIcon color={surface.text} />
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
          <Text style={{ fontSize: 17, color: surface.text }}>This account isn’t available.</Text>
          <Button label="Go back" onPress={goBack} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (sf: Surface) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: sf.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: sf.line },
  back: { minHeight: TOUCH, minWidth: 80, flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 17, color: sf.text },
  title: { fontSize: 17, fontWeight: '600', color: sf.text },
});

/** Profiles aren't a niche feed, so they sit on the app background, whatever niche you were last in. */
export default function UserScreen() {
  const ground = useAppGround();
  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <UserScreenInner />
    </SurfaceProvider>
  );
}
