import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NICHE_BORDER, tileTitle } from '@/components/feed-grid';
import { Avatar, Button, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { isVisible, useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, type NicheId } from '@/lib/theme';
import type { Post, User } from '@/lib/types';

type Tab = 'all' | NicheId;

/** One profile per person, with a tab per niche they post in. Used for you and for others. */
export function ProfileView({ user, isMe, footer }: { user: User; isMe: boolean; footer?: ReactNode }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const niches = useNiches();
  const [tab, setTab] = useState<Tab>('all');

  const posts = state.posts
    .filter((p) => p.authorId === user.id && (isMe ? !p.archived : isVisible(state, p)))
    .sort((a, b) => b.createdAt - a.createdAt);
  const nicheTabs = NICHE_ORDER.filter((id) => posts.some((p) => p.niche === id));
  const shown = tab === 'all' ? posts : posts.filter((p) => p.niche === tab);
  const following = !!state.following[user.id];

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.identity}>
          <Avatar user={user} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <DisplayText size={26}>{user.displayName}</DisplayText>
            <Text style={styles.handle}>{user.username}</Text>
          </View>
        </View>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        {nicheTabs.length ? (
          <View style={styles.nicheRow}>
            {nicheTabs.map((id) => (
              <View key={id} style={[styles.nichePill, { backgroundColor: niches[id].field }]}>
                <Text style={[styles.nichePillText, { color: niches[id].ink }]}>{niches[id].label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {isMe ? null : (
          <Button
            label={following ? 'Following' : 'Follow'}
            tone={following ? 'outline' : 'solid'}
            color={niches[nicheTabs[0] ?? state.niche].accent}
            onPress={() => actions.toggleFollow(user.id)}
            accessibilityState={{ selected: following }}
          />
        )}
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['all', ...nicheTabs] as Tab[]).map((t) => {
          const selected = t === tab;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: selected ? colors.text : 'transparent' }]}>
              <Text style={[styles.tabText, { color: selected ? colors.text : '#6B7178' }]}>{t === 'all' ? 'All' : niches[t].label}</Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          {isMe ? (
            <>
              <Text style={styles.emptyBody}>Share your first dish, a question, or progress toward a goal.</Text>
              <Button label="Create a post" color={niches[state.niche].accent} onPress={() => router.navigate('/create')} />
            </>
          ) : null}
        </View>
      ) : (
        // The "All" tab mixes niches, so tiles get niche borders like Discover and Saved.
        <PostSquares posts={shown} nicheBorders={tab === 'all' && nicheTabs.length > 1} />
      )}

      {footer}
    </View>
  );
}

/** Three-across square grid, as on Instagram profiles. */
export function PostSquares({ posts, nicheBorders = false }: { posts: Post[]; nicheBorders?: boolean }) {
  const router = useRouter();
  const niches = useNiches();
  return (
    <View style={styles.grid}>
      {posts.map((p) => {
        const n = niches[p.niche];
        return (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${n.label} post: ${tileTitle(p)}`}
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
            style={[styles.cell, nicheBorders ? { borderWidth: NICHE_BORDER, borderColor: n.accent } : null]}>
            {p.kind === 'text' ? (
              <View style={[styles.textCell, { backgroundColor: n.field }]}>
                <Text style={[styles.textCellText, { color: n.ink }]} numberOfLines={4}>{p.caption}</Text>
              </View>
            ) : (
              <MediaPlaceholder post={p} height={nicheBorders ? 122 : 128} showLabel={false} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  handle: { fontSize: 14, color: colors.textMuted },
  bio: { fontSize: 15, lineHeight: 21, color: colors.text },
  nicheRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nichePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nichePillText: { fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginTop: 18, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingTop: 2 },
  cell: { width: '33%', flexGrow: 1, maxWidth: '33.4%', height: 128, overflow: 'hidden' },
  textCell: { flex: 1, padding: 10, justifyContent: 'flex-end' },
  textCellText: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  empty: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: colors.surface, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
});
