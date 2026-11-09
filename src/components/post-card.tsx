import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { LockedPanel, NameWithBadges } from '@/components/creator';
import { BookmarkIcon, CommentIcon, HeartIcon, LockIcon, MoreIcon, PauseIcon, PlayIcon, StarIcon, TrendIcon } from '@/components/icons';
import { useSwipeBlocked } from '@/components/niche-swipe';
import { PostMenu } from '@/components/post-menu';
import { Avatar, MediaPlaceholder } from '@/components/primitives';
import { ShopThisBar } from '@/components/shop';
import { useSurface } from '@/components/surface';
import { timeAgo } from '@/lib/format';
import { hasAccess, postStats, useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';
import type { Post } from '@/lib/types';

/** A post in the single-column feed, and the top of the post screen. */
export function PostCard({ post, mediaHeight = 440, inDetail = false, onGone }: { post: Post; mediaHeight?: number; inDetail?: boolean; onGone?: () => void }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[post.niche];
  const surface = useSurface();
  const active = surface.active(niche);
  const [menuOpen, setMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  // Real photos keep their own shape (between 4:5 portrait and 5:4 landscape), like Instagram.
  // On a flooded screen photos sit inset with rounded corners, like prints on colored paper.
  const mediaWidth = Math.min(width, 640) - (surface.flood ? 32 : 0);
  const photoHeight = post.imageUri && post.imageAspect ? Math.round(mediaWidth * Math.min(1.25, Math.max(0.8, post.imageAspect))) : mediaHeight;
  const inset = surface.flood ? styles.mediaInset : null;
  const swiping = useSwipeBlocked();
  const author = usersById[post.authorId];
  const isMine = !!state.me && post.authorId === state.me.id;
  // Members-only posts are locked for anyone who isn't a member and hasn't unlocked them.
  const locked = !hasAccess(state, post);
  const cheered = !!state.cheers[post.id];
  const saved = !!state.saves[post.id];
  const stats = postStats(state, post);
  const commentCount = stats.comments;
  // Only the author sees numbers (unless they hid the like count from themselves).
  const likeLabel = isMine && !post.hideCheers ? `${stats.cheers} ${stats.cheers === 1 ? 'like' : 'likes'}` : cheered ? 'Liked' : 'Like';
  const saveLabel = isMine ? `${stats.saves} ${stats.saves === 1 ? 'save' : 'saves'}` : saved ? 'Saved' : 'Save';
  const open = () => {
    if (swiping()) return;
    if (!inDetail) router.push({ pathname: '/post/[id]', params: { id: post.id } });
  };
  const openAuthor = () => (isMine ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: post.authorId } }));

  return (
    <View style={[styles.card, inDetail ? null : [styles.cardDivider, { borderBottomColor: surface.line }]]}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${author?.username ?? 'author'}’s profile`} onPress={openAuthor} style={styles.author}>
          <Avatar user={author} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <NameWithBadges user={author} style={[styles.user, { color: surface.text }]} />
            <Text style={[styles.time, { color: surface.muted }]}>
              {timeAgo(post.createdAt)}
              {post.editedAt ? ' · edited' : ''}
              {post.archived ? ' · archived' : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} hitSlop={4} style={styles.iconButton}>
          <MoreIcon color={surface.body} />
        </Pressable>
      </View>

      {locked && post.kind !== 'text' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Members-only post. Open to see options" onPress={open} disabled={inDetail}>
          <View style={[styles.lockedMedia, inset, { height: Math.round(mediaHeight * 0.55), backgroundColor: post.mediaColor ?? niche.field }]}>
            <View style={styles.lockedVeil} />
            <LockIcon size={28} color="#FFFFFF" />
            <Text style={styles.lockedMediaText}>Members only</Text>
          </View>
        </Pressable>
      ) : null}
      {!locked && post.kind === 'photo' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Open post" onPress={open} disabled={inDetail}>
          <View style={inset}>
            <MediaPlaceholder post={post} height={inDetail ? Math.min(photoHeight, 420) : photoHeight} />
          </View>
        </Pressable>
      ) : null}
      {!locked && post.kind === 'video' ? (
        <View style={inset}>
          <VideoPlaceholder post={post} height={mediaHeight} />
        </View>
      ) : null}

      <Pressable onPress={open} disabled={inDetail} accessibilityRole={inDetail ? undefined : 'button'} accessibilityLabel={inDetail ? undefined : 'Open post'} style={styles.body}>
        {post.progressLabel ? (
          <View style={[styles.tag, { backgroundColor: surface.flood ? '#FFFFFF' : niche.field }]}>
            <TrendIcon color={niche.ink} />
            <Text style={[styles.tagText, { color: niche.ink }]}>Progress · {post.progressLabel}</Text>
          </View>
        ) : null}
        {post.premium && !locked ? (
          <View style={[styles.tag, { backgroundColor: surface.flood ? '#FFFFFF' : niche.field }]}>
            <StarIcon size={11} color={niche.ink} />
            <Text style={[styles.tagText, { color: niche.ink }]}>{isMine ? 'Members only' : 'Members only · unlocked for you'}</Text>
          </View>
        ) : null}
        <Text style={[styles.caption, { color: surface.text }, post.kind === 'text' ? styles.captionLarge : null]} numberOfLines={locked ? 2 : undefined}>
          {post.caption}
        </Text>
      </Pressable>

      {locked ? <LockedPanel post={post} author={author} /> : null}

      <ShopThisBar postId={post.id} />

      {locked ? <View style={{ height: 10 }} /> : (
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: cheered }}
          accessibilityLabel={isMine ? `${likeLabel}${cheered ? ', you liked this' : ''}` : likeLabel}
          onPress={() => !swiping() && actions.toggleCheer(post.id)}
          style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <HeartIcon filled={cheered} color={cheered ? active : surface.body} />
          <Text style={[styles.actionText, { color: cheered ? active : surface.body }]}>{likeLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.commentsOff ? 'Comments are off' : `${commentCount} comments`}
          onPress={open}
          disabled={inDetail}
          style={styles.action}>
          <CommentIcon color={surface.body} />
          <Text style={[styles.actionText, { fontWeight: '500', color: surface.body }]}>
            {post.commentsOff ? 'Comments off' : `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={isMine ? `${saveLabel}${saved ? ', you saved this' : ''}` : saveLabel}
          onPress={() => !swiping() && actions.toggleSave(post.id)}
          style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <BookmarkIcon size={20} filled={saved} color={saved ? active : surface.body} />
          <Text style={[styles.actionText, { color: saved ? active : surface.body }]}>{saveLabel}</Text>
        </Pressable>
      </View>
      )}

      <PostMenu post={post} visible={menuOpen} onClose={() => setMenuOpen(false)} onGone={onGone} />
    </View>
  );
}

/** Video never autoplays: it waits for a tap. (Demo: no real video yet.) */
function VideoPlaceholder({ post, height }: { post: Post; height: number }) {
  const [playing, setPlaying] = useState(false);
  return (
    <View>
      <MediaPlaceholder post={post} height={height} />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.playWrap} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause video' : 'Play video'}
            onPress={() => setPlaying((p) => !p)}
            style={({ pressed }) => [styles.play, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingBottom: 6 },
  mediaInset: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden' },
  cardDivider: { borderBottomWidth: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 20, paddingRight: 8, paddingVertical: 12 },
  author: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH },
  user: { fontSize: 15, fontWeight: '600', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  tag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: '600' },
  caption: { fontSize: 15, lineHeight: 21, color: colors.text },
  captionLarge: { fontSize: 19, lineHeight: 26 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingTop: 4 },
  action: { minHeight: TOUCH, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  lockedMedia: { alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  lockedVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,22,26,0.55)' },
  lockedMediaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  playWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
