import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { NameWithBadges } from '@/components/creator';
import { Avatar } from '@/components/primitives';
import { connections, useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

type Tab = 'followers' | 'following';

/** Followers / Following lists for any profile, like Instagram. */
export default function ConnectionsScreen() {
  const { id, tab: initial } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [tab, setTab] = useState<Tab>(initial === 'following' ? 'following' : 'followers');
  const user = usersById[id];
  const lists = connections(state, id);
  const ids = lists[tab];
  const isMe = id === state.me?.id;
  const accent = niches[state.niche].accent;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{user?.username ?? ''}</Text>
        <View style={{ width: TOUCH }} />
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['followers', 'following'] as Tab[]).map((t) => {
          const selected = t === tab;
          const n = lists[t].length;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: selected ? colors.text : 'transparent' }]}>
              <Text style={[styles.tabText, { color: selected ? colors.text : '#6B7178' }]}>
                {n} {t === 'followers' ? (n === 1 ? 'follower' : 'followers') : 'following'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {ids.length === 0 ? (
          <Text style={styles.empty}>
            {tab === 'followers'
              ? isMe
                ? 'No followers yet. Post in a niche and people who like your work can follow you.'
                : 'No followers yet.'
              : isMe
                ? 'You’re not following anyone yet. Find people on Discover.'
                : 'Not following anyone yet.'}
          </Text>
        ) : (
          ids.map((uid) => {
            const u = usersById[uid];
            if (!u) return null;
            const mine = uid === state.me?.id;
            const following = !!state.following[uid];
            return (
              <View key={uid} style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${u.displayName}’s profile`}
                  onPress={() => (mine ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: uid } }))}
                  style={styles.person}>
                  <Avatar user={u} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <NameWithBadges user={u} style={styles.name} />
                    <Text style={styles.sub} numberOfLines={1}>{u.displayName}</Text>
                  </View>
                </Pressable>
                {mine ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: following }}
                    accessibilityLabel={following ? `Following ${u.username}` : `Follow ${u.username}`}
                    onPress={() => actions.toggleFollow(uid)}
                    style={({ pressed }) => [styles.follow, following ? styles.following : { backgroundColor: accent, borderColor: accent }, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                    <Text style={[styles.followText, { color: following ? colors.textBody : '#FFFFFF' }]}>{following ? 'Following' : 'Follow'}</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  back: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  empty: { padding: 24, fontSize: 15, lineHeight: 21, color: colors.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  person: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted },
  follow: { minHeight: 36, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  following: { backgroundColor: '#FFFFFF', borderColor: colors.border },
  followText: { fontSize: 14, fontWeight: '700' },
});
