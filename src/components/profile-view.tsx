import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { NICHE_BORDER, tileTitle } from '@/components/feed-grid';
import { Badges, MembershipCard } from '@/components/creator';
import { DiaryRow, TopFour } from '@/components/diary';
import { GoalCard } from '@/components/goals';
import { LockIcon } from '@/components/icons';
import { PlanCard } from '@/components/plan-card';
import { ListingGrid } from '@/components/shop';
import { Avatar, Button, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { useSurface, useSurfaceStyles } from '@/components/surface';
import { pickPhoto } from '@/lib/photos';
import { isoDay } from '@/lib/plans';
import { diaryWords } from '@/lib/diary';
import { progress, visibleGoals } from '@/lib/goals';
import { connections, hasAccess, isVisible, useNiches, useStore, visibleLogs } from '@/lib/store';
import { colors, fonts, NICHE_ORDER, type NicheId, type Surface } from '@/lib/theme';
import type { Post, User } from '@/lib/types';

type Tab = 'all' | NicheId | 'shop' | 'diary' | 'goals';

/** One profile per person, with a tab per niche they post in. Used for you and for others. */
export function ProfileView({ user, isMe, footer }: { user: User; isMe: boolean; footer?: ReactNode }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const router = useRouter();
  const { state, actions } = useStore();
  const niches = useNiches();
  const [tab, setTab] = useState<Tab>('all');

  const posts = state.posts
    .filter((p) => p.authorId === user.id && (isMe ? !p.archived : isVisible(state, p)))
    .sort((a, b) => b.createdAt - a.createdAt);
  const nicheTabs = NICHE_ORDER.filter((id) => posts.some((p) => p.niche === id));
  const listings = state.listings.filter((l) => l.sellerId === user.id);
  const logs = visibleLogs(state, user.id);
  const goals = visibleGoals(state.goals, user.id, state.me?.id).sort((a, b) => Number(!!a.doneAt) - Number(!!b.doneAt) || b.createdAt - a.createdAt);
  const weekly = goals.filter((g) => g.kind === 'habit' && !g.doneAt);
  const isNicheTab = (t: Tab): t is NicheId => t !== 'all' && t !== 'shop' && t !== 'diary' && t !== 'goals';
  const shown = tab === 'all' ? posts : isNicheTab(tab) ? posts.filter((p) => p.niche === tab) : [];
  // The niche this person is most active in (posts and diary), so the profile
  // looks the same whichever niche was last open on Home.
  const activity: Partial<Record<NicheId, number>> = {};
  for (const p of posts) activity[p.niche] = (activity[p.niche] ?? 0) + 1;
  for (const l of logs) activity[l.niche] = (activity[l.niche] ?? 0) + 1;
  const mainNiche: NicheId = NICHE_ORDER.reduce((best, id) => ((activity[id] ?? 0) > (activity[best] ?? 0) ? id : best), 'cooking' as NicheId);
  const withPicks = NICHE_ORDER.filter((id) => (state.favorites[user.id]?.[id]?.length ?? 0) > 0);
  // Top 4 rows: the niche tab you're on; on "All", every niche with picks (or, if you have none yet, your main niche so you can start one). Never the niche last open on Home.
  const favNiches: NicheId[] =
    isNicheTab(tab)
      ? [tab]
      : withPicks.length
        ? withPicks
        : isMe
          ? [mainNiche]
          : [];
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonth = logs.filter((l) => l.date.startsWith(monthPrefix)).length;
  const avg = logs.length ? logs.reduce((n, l) => n + l.rating, 0) / logs.length : 0;
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
            <DisplayText size={36} color={surface.text}>{user.displayName}</DisplayText>
            <Badges user={user} size={20} />
          </View>
          <Text style={styles.handle}>{user.username}</Text>
        </View>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        {user.membership ? (
          <MembershipCard
            creator={user}
            accent={surface.text}
            field="#FFFFFF"
            ink={surface.text}
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
            color={surface.text}
            textStyle={following ? { color: surface.text } : undefined}
            style={following ? { borderColor: surface.line, backgroundColor: 'rgba(255,255,255,0.35)' } : undefined}
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

      {favNiches.length && tab !== 'shop' && tab !== 'goals' ? (
        <View style={styles.favs}>
          {favNiches.map((id) => (
            <TopFour key={id} userId={user.id} niche={id} isMe={isMe} />
          ))}
        </View>
      ) : null}

      {/* Tabs keep their natural width (no wrapped labels) and scroll sideways if they don't all fit. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" style={styles.tabs} contentContainerStyle={styles.tabsRow}>
        {(['all', ...nicheTabs, ...(logs.length || isMe ? ['diary'] : []), ...(goals.length || isMe ? ['goals'] : []), ...(listings.length ? ['shop'] : [])] as Tab[]).map((t) => {
          const selected = t === tab;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: selected ? surface.text : 'transparent' }]}>
              <Text numberOfLines={1} style={[styles.tabText, { color: selected ? surface.text : surface.muted }]}>{t === 'all' ? 'All' : t === 'shop' ? `Shop · ${listings.length}` : t === 'diary' ? 'Diary' : t === 'goals' ? 'Goals' : niches[t].label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {tab === 'goals' ? (
        <View style={styles.diary}>
          {isMe && weekly.length ? (
            <Text style={styles.goalsSummary}>
              This week: <Text style={{ fontWeight: '800', color: surface.text }}>{weekly.filter((g) => progress(g).fraction >= 1).length} of {weekly.length}</Text> weekly {weekly.length === 1 ? 'goal' : 'goals'} done
            </Text>
          ) : null}
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} viewerIsOwner={isMe} />
          ))}
          {goals.length === 0 ? (
            <Text style={styles.diaryEmpty}>
              {isMe ? 'Set a goal and check in when you work on it. Streaks are weekly, rest weeks never break one, and goals are private unless you choose otherwise.' : 'No public goals.'}
            </Text>
          ) : null}
          {isMe ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Button label="New goal" color={surface.text} style={{ flex: 1 }} onPress={() => router.push({ pathname: '/goals/new', params: { niche: mainNiche } })} />
              {goals.length ? <Button label="All goals" tone="outline" style={{ flex: 1 }} onPress={() => router.push('/goals')} /> : null}
            </View>
          ) : null}
          {isMe && goals.some((g) => g.visibility === 'private') ? <Text style={styles.diaryNote}>Goals with a lock are private. Others only see the ones you put on your profile.</Text> : null}
        </View>
      ) : tab === 'diary' ? (
        <View style={styles.diary}>
          {isMe ? <RecapCard niche={mainNiche} /> : null}
          {logs.length ? (
            <View style={[styles.diaryStats, { backgroundColor: '#FFFFFF' }]}>
              <Stat value={String(logs.length)} label="logged" ink={surface.text} />
              <Stat value={String(thisMonth)} label="this month" ink={surface.text} />
              <Stat value={avg ? avg.toFixed(1) : '–'} label="avg stars" ink={surface.text} />
            </View>
          ) : null}
          {isMe ? (
            <Button
              label={`${diaryWords(mainNiche).did}: log something`}
              color={surface.text}
              onPress={() => router.push({ pathname: '/log/new', params: { niche: mainNiche } })}
            />
          ) : null}
          {logs.length === 0 ? (
            <Text style={styles.diaryEmpty}>
              {isMe
                ? 'Your diary is private by default: a record of everything you make, with stars and notes for next time. Tap “I made this” on any post, or log something of your own.'
                : 'Nothing in their diary yet.'}
            </Text>
          ) : (
            logs.map((l) => <DiaryRow key={l.id} log={l} showPrivacy={isMe} />)
          )}
          {isMe && logs.length ? <Text style={styles.diaryNote}>Entries with a lock are private. Everything else shows here on your profile.</Text> : null}
        </View>
      ) : tab === 'shop' ? (
        <ListingGrid listings={listings} nicheBorders={new Set(listings.map((l) => l.niche)).size > 1} />
      ) : shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          {isMe ? (
            <>
              <Text style={styles.emptyBody}>Share your first dish, a question, or progress toward a goal.</Text>
              <Button label="Create a post" color={surface.text} onPress={() => router.navigate('/create')} />
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

/** Entry to "Your year in Cooking" from your own diary. */
function RecapCard({ niche: id }: { niche: NicheId }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const router = useRouter();
  const n = useNiches()[id];
  const year = new Date().getFullYear();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your ${year} in ${n.label}. Open recap`}
      onPress={() => router.push({ pathname: '/recap/[niche]', params: { niche: id } })}
      style={({ pressed }) => [styles.recap, { backgroundColor: surface.text, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={[styles.recapYear, { color: surface.ground }]}>{year}</Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.recapTitle}>Your year in {n.label}</Text>
        <Text style={[styles.recapSub, { color: surface.ground }]}>What you made, your go-tos, your best weeks</Text>
      </View>
    </Pressable>
  );
}

function Stat({ value, label, ink }: { value: string; label: string; ink: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: ink, fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ fontSize: 12, color: ink }}>{label}</Text>
    </View>
  );
}

function Count({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const styles = useSurfaceStyles(makeStyles);
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
  const styles = useSurfaceStyles(makeStyles);
  const router = useRouter();
  const niches = useNiches();
  const { state } = useStore();
  // Exactly three squares per row: measure the row and size each cell from it.
  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0);
  const size = Math.floor(((rowWidth || windowWidth) - GRID_GAP * 2) / 3);
  return (
    <View style={styles.grid} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      {posts.map((p) => {
        const n = niches[p.niche];
        return (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${n.label} post: ${tileTitle(p)}`}
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
            style={[styles.cell, { width: size, height: size }, nicheBorders ? { borderWidth: NICHE_BORDER, borderColor: n.accent } : null]}>
            {p.kind === 'text' ? (
              <View style={[styles.textCell, { backgroundColor: n.field }]}>
                <Text style={[styles.textCellText, { color: n.ink }]} numberOfLines={4}>{p.caption}</Text>
              </View>
            ) : (
              <MediaPlaceholder post={p} height={size - (nicheBorders ? NICHE_BORDER * 2 : 0)} showLabel={false} />
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

const GRID_GAP = 2;

const makeStyles = (sf: Surface) =>
  StyleSheet.create({
  head: { paddingHorizontal: 20, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  handle: { fontSize: 14, color: sf.muted },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, minWidth: 26, height: 26, paddingHorizontal: 6, borderRadius: 13, backgroundColor: sf.text, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  avatarEditText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  counts: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  count: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  countValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: sf.text, fontVariant: ['tabular-nums'] },
  countLabel: { fontSize: 13, color: sf.muted },
  bio: { fontSize: 15, lineHeight: 21, color: sf.text },
  nicheRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nichePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  nichePillText: { fontSize: 12, fontWeight: '700' },
  plans: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  favs: { paddingHorizontal: 20, marginTop: 20, gap: 16 },
  diary: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  diaryStats: { flexDirection: 'row', paddingVertical: 14, borderRadius: 16, marginBottom: 6 },
  diaryEmpty: { fontSize: 15, lineHeight: 21, color: sf.body, padding: 16, borderRadius: 14, backgroundColor: sf.raised },
  goalsSummary: { fontSize: 15, color: sf.body, marginBottom: 4 },
  recap: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, marginBottom: 6 },
  recapYear: { fontFamily: fonts.displayItalic, fontSize: 40, letterSpacing: -1 },
  recapTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  recapSub: { fontSize: 13, marginTop: 2 },
  diaryNote: { fontSize: 13, color: sf.muted, marginTop: 6 },
  plansHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plansTitle: { fontSize: 17, fontWeight: '700', color: sf.text },
  seeAll: { minHeight: 36, justifyContent: 'center', paddingLeft: 12 },
  seeAllText: { fontSize: 15, fontWeight: '600', color: sf.body },
  tabs: { marginTop: 18, borderBottomWidth: 1, borderBottomColor: sf.line, flexGrow: 0 },
  tabsRow: { flexGrow: 1, paddingHorizontal: 8 },
  tab: { flexGrow: 1, minHeight: 46, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingTop: GRID_GAP },
  cell: { overflow: 'hidden' },
  lockVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,22,26,0.5)', alignItems: 'center', justifyContent: 'center' },
  textCell: { flex: 1, padding: 10, justifyContent: 'flex-end' },
  textCellText: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  empty: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: sf.raised, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: sf.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: sf.body },
});
