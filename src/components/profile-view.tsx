import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NICHE_BORDER, tileTitle } from '@/components/feed-grid';
import { Badges, MembershipCard } from '@/components/creator';
import { LockIcon } from '@/components/icons';
import { PlanCard } from '@/components/plan-card';
import { ListingGrid } from '@/components/shop';
import { Avatar, Button, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { pickPhoto } from '@/lib/photos';
import { isoDay } from '@/lib/plans';
import { connections, hasAccess, isVisible, useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, type NicheId } from '@/lib/theme';
import type { Post, User } from '@/lib/types';

type Tab = 'all' | NicheId | 'shop';

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
  const listings = state.listings.filter((l) => l.sellerId === user.id);
  const shown = tab === 'all' ? posts : tab === 'shop' ? [] : posts.filter((p) => p.niche === tab);
  const following = !!state.following[user.id];
  const { followers, following: follows } = connections(state, user.id);
  // Your own upcoming plans, or the public plans someone else is hosting.
  const today = isoDay();
  const plans = state.plans
    .filter((p) => p.date >= today && (isMe ? p.ownerId === user.id || p.invitees.includes(user.id) || !!p.rsvps[user.id] : p.ownerId === user.id && p.visibility === 'public'))
    .sort((a, b) => a.date.localeCompare(b.date));
  const openList = (tab: 'followers' | 'following') => router.push({ pathname: '/connections/[id]', params: { id: user.id, tab } });

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.identity}>
          {isMe ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={user.avatarUri ? 'Change profile photo' : 'Add a profile photo'}
              onPress={async () => {
                const picked = await pickPhoto([1, 1]);
                if (picked) actions.setAvatar(picked.uri);
              }}>
              <Avatar user={user} size={72} />
              <View style={styles.avatarEdit}>
                <Text style={styles.avatarEditText}>{user.avatarUri ? 'Edit' : '+'}</Text>
              </View>
            </Pressable>
          ) : (
            <Avatar user={user} size={72} />
          )}
          <View style={styles.counts}>
            <Count value={posts.length} label={posts.length === 1 ? 'post' : 'posts'} />
            <Count value={followers.length} label={followers.length === 1 ? 'follower' : 'followers'} onPress={() => openList('followers')} />
            <Count value={follows.length} label="following" onPress={() => openList('following')} />
          </View>
        </View>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <DisplayText size={24}>{user.displayName}</DisplayText>
            <Badges user={user} size={20} />
          </View>
          <Text style={styles.handle}>{user.username}</Text>
        </View>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        {user.membership ? (
          <MembershipCard
            creator={user}
            accent={niches[nicheTabs[0] ?? state.niche].accent}
            field={niches[nicheTabs[0] ?? state.niche].field}
            ink={niches[nicheTabs[0] ?? state.niche].ink}
          />
        ) : null}
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

      {plans.length ? (
        <View style={styles.plans}>
          <View style={styles.plansHead}>
            <Text style={styles.plansTitle}>{isMe ? 'Your upcoming plans' : 'Upcoming plans'}</Text>
            {isMe ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/plans')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            ) : null}
          </View>
          {plans.slice(0, 2).map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </View>
      ) : null}

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['all', ...nicheTabs, ...(listings.length ? ['shop'] : [])] as Tab[]).map((t) => {
          const selected = t === tab;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: selected ? colors.text : 'transparent' }]}>
              <Text style={[styles.tabText, { color: selected ? colors.text : '#6B7178' }]}>{t === 'all' ? 'All' : t === 'shop' ? `Shop · ${listings.length}` : niches[t].label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'shop' ? (
        <ListingGrid listings={listings} nicheBorders={new Set(listings.map((l) => l.niche)).size > 1} />
      ) : shown.length === 0 ? (
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

function Count({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.count, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </Pressable>
  );
}

/** Three-across square grid, as on Instagram profiles. */
export function PostSquares({ posts, nicheBorders = false }: { posts: Post[]; nicheBorders?: boolean }) {
  const router = useRouter();
  const niches = useNiches();
  const { state } = useStore();
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
            {!hasAccess(state, p) ? (
              <View style={styles.lockVeil} accessibilityLabel="Members only">
                <LockIcon size={18} color="#FFFFFF" />
              </View>
            ) : null}
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
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: colors.text, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  avatarEditText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  counts: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  count: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  countValue: { fontSize: 18, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  countLabel: { fontSize: 13, color: colors.textMuted },
  bio: { fontSize: 15, lineHeight: 21, color: colors.text },
  nicheRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nichePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nichePillText: { fontSize: 12, fontWeight: '700' },
  plans: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  plansHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plansTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  seeAll: { minHeight: 36, justifyContent: 'center', paddingLeft: 12 },
  seeAllText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  tabs: { flexDirection: 'row', marginTop: 18, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingTop: 2 },
  cell: { width: '33%', flexGrow: 1, maxWidth: '33.4%', height: 128, overflow: 'hidden' },
  lockVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,22,26,0.5)', alignItems: 'center', justifyContent: 'center' },
  textCell: { flex: 1, padding: 10, justifyContent: 'flex-end' },
  textCellText: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  empty: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: colors.surface, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
});
