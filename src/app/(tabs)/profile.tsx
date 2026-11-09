import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { PostSquares, ProfileView } from '@/components/profile-view';
import { SurfaceProvider, useSurface, useSurfaceStyles } from '@/components/surface';
import { useNiches, useStore } from '@/lib/store';
import { floodSurface, NICHE_ORDER, TOUCH, type Surface } from '@/lib/theme';

function ProfileScreenInner() {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const niches = useNiches();
  const [showArchive, setShowArchive] = useState(false);
  const me = state.me;
  if (!me) return null;

  const archived = state.posts.filter((p) => p.authorId === me.id && p.archived).sort((a, b) => b.createdAt - a.createdAt);

  const confirmReset = () => {
    const run = () => actions.resetDemo();
    const message = 'This signs you out and deletes your demo account, posts, saves and comments from this device.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) run();
      return;
    }
    Alert.alert('Delete demo account?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
      <ProfileView
        user={me}
        isMe
        footer={
          <View style={styles.settings}>
            <Text style={styles.settingsTitle}>Archive</Text>
            {archived.length === 0 ? (
              <Text style={styles.rowValue}>Nothing archived. Archive a post from its ⋯ menu to hide it without deleting it.</Text>
            ) : (
              <>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: showArchive }} onPress={() => setShowArchive((v) => !v)} style={styles.linkRow}>
                  <Text style={styles.rowLabel}>{archived.length} archived {archived.length === 1 ? 'post' : 'posts'}</Text>
                  <Text style={styles.rowAction}>{showArchive ? 'Hide' : 'Show'}</Text>
                </Pressable>
                {showArchive ? (
                  <View style={{ marginHorizontal: -20 }}>
                    <PostSquares posts={archived} />
                  </View>
                ) : null}
              </>
            )}

            <Text style={[styles.settingsTitle, { marginTop: 24 }]}>Settings</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push(me.membership ? '/creators/studio' : '/creators/apply')} style={styles.linkRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>{me.membership ? 'Creator studio' : 'Become a creator'}</Text>
                <Text style={styles.rowValue}>
                  {me.membership ? 'Price, perks and earnings for your membership.' : state.creatorApplication ? 'Invite requested. We’ll let you know.' : 'Invite-only. Get verified or charge for members-only posts.'}
                </Text>
              </View>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <ChevronLeftIcon size={18} color={surface.muted} />
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/creators/memberships')} style={styles.linkRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>Memberships</Text>
                <Text style={styles.rowValue}>
                  {Object.keys(state.memberships).length ? `Member of ${Object.keys(state.memberships).length} ${Object.keys(state.memberships).length === 1 ? 'creator' : 'creators'}` : 'Creators you support, and posts you unlocked.'}
                </Text>
              </View>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <ChevronLeftIcon size={18} color={surface.muted} />
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/settings/colors')} style={styles.linkRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>Color lab</Text>
                <Text style={styles.rowValue}>Try different colors for each niche.</Text>
              </View>
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
                {NICHE_ORDER.map((id) => (
                  <View key={id} style={[styles.dot, { backgroundColor: niches[id].accent }]} />
                ))}
              </View>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <ChevronLeftIcon size={18} color={surface.muted} />
              </View>
            </Pressable>
            <Row label="Notifications" value="Daily digest at 6:00 PM (coming soon)" />
            <Row label="Born" value={`${me.birthDate} · never shown`} />
            <Button tone="outline" label="Delete demo account" textStyle={{ color: surface.flood ? surface.text : "#B42318" }} onPress={confirmReset} style={{ marginTop: 12 }} />
          </View>
        }
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useSurfaceStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (sf: Surface) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: sf.ground },
  settings: { marginTop: 28, paddingHorizontal: 20, gap: 4 },
  settingsTitle: { fontSize: 17, fontWeight: '700', color: sf.text, marginBottom: 6 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: sf.line, gap: 2 },
  linkRow: { minHeight: TOUCH + 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: sf.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 15, color: sf.text, fontWeight: '500', flexShrink: 1 },
  rowValue: { fontSize: 13, lineHeight: 18, color: sf.muted },
  rowAction: { marginLeft: 'auto', fontSize: 15, fontWeight: '600', color: sf.body },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});

/** Your profile, flooded in the color of the niche you're in. */
export default function ProfileScreen() {
  const { state } = useStore();
  const niches = useNiches();
  return (
    <SurfaceProvider value={floodSurface(niches[state.niche])}>
      <ProfileScreenInner />
    </SurfaceProvider>
  );
}
