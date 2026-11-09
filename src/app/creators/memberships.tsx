import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NameWithBadges } from '@/components/creator';
import { ChevronLeftIcon } from '@/components/icons';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { formatPrice } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

/** Creators you're a member of, and posts you unlocked. Cancel anytime. */
export default function MembershipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ids = Object.keys(state.memberships).filter((id) => usersById[id]);
  const unlocked = state.posts.filter((p) => state.unlocks[p.id]);
  const monthly = ids.reduce((n, id) => n + (usersById[id]?.membership?.priceCents ?? 0), 0);

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 40 }}>
        <DisplayText size={34}>Memberships</DisplayText>
        <Text style={styles.sub}>{ids.length ? `${formatPrice(monthly)} a month in total (demo, nothing is charged).` : 'Creators you join show up here. Cancel anytime.'}</Text>

        {ids.map((id) => {
          const u = usersById[id];
          return (
            <View key={id} style={styles.row}>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/user/[id]', params: { id } })} style={styles.person}>
                <Avatar user={u} size={44} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <NameWithBadges user={u} />
                  <Text style={styles.meta}>
                    {formatPrice(u.membership?.priceCents ?? 0)}/mo · since {new Date(state.memberships[id]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cancel membership with ${u.username}`}
                onPress={() => {
                  actions.cancelMembership(id);
                  toast(`Cancelled ${u.username}`);
                }}
                style={styles.cancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          );
        })}

        {!ids.length ? <Button label="Find creators on Discover" color={niches[state.niche].accent} onPress={() => router.navigate('/discover')} /> : null}

        {unlocked.length ? (
          <>
            <Text style={styles.section}>Posts you unlocked</Text>
            {unlocked.map((p) => (
              <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })} style={styles.unlocked}>
                <View style={[styles.thumb, { backgroundColor: p.mediaColor ?? niches[p.niche].field }]} />
                <Text style={styles.unlockedText} numberOfLines={2}>{p.mediaLabel ?? p.caption}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { paddingHorizontal: 6 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  person: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  meta: { fontSize: 13, color: colors.textMuted },
  cancel: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.textBody },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
  unlocked: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH + 8 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  unlockedText: { flex: 1, fontSize: 15, color: colors.text },
});
