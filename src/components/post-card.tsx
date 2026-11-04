import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon, CheerIcon, CommentIcon, MoreIcon, PauseIcon, PlayIcon, TrendIcon } from '@/components/icons';
import { PostMenu } from '@/components/post-menu';
import { Avatar, MediaPlaceholder } from '@/components/primitives';
import { timeAgo } from '@/lib/format';
import { postStats, useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';
import type { Post } from '@/lib/types';

/** A post in the single-column feed, and the top of the post screen. */
export function PostCard({ post, mediaHeight = 440, inDetail = false, onGone }: { post: Post; mediaHeight?: number; inDetail?: boolean; onGone?: () => void }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[post.niche];
  const [menuOpen, setMenuOpen] = useState(false);
  const author = usersById[post.authorId];
  const isMine = !!state.me && post.authorId === state.me.id;
  const cheered = !!state.cheers[post.id];
  const saved = !!state.saves[post.id];
  const commentCount = postStats(state, post).comments;
  const open = () => {
    if (!inDetail) router.push({ pathname: '/post/[id]', params: { id: post.id } });
  };
  const openAuthor = () => (isMine ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: post.authorId } }));

  return (
    <View style={[styles.card, inDetail ? null : styles.cardDivider]}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${author?.username ?? 'author'}’s profile`} onPress={openAuthor} style={styles.author}>
          <Avatar user={author} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.user} numberOfLines={1}>{author?.username ?? 'unknown'}</Text>
            <Text style={styles.time}>
              {timeAgo(post.createdAt)}
              {post.editedAt ? ' · edited' : ''}
              {post.archived ? ' · archived' : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} hitSlop={4} style={styles.iconButton}>
          <MoreIcon />
        </Pressable>
      </View>

      {post.kind === 'photo' ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Open post" onPress={open} disabled={inDetail}>
          <MediaPlaceholder post={post} height={mediaHeight} />
        </Pressable>
      ) : null}
      {post.kind === 'video' ? <VideoPlaceholder post={post} height={mediaHeight} /> : null}

      <Pressable onPress={open} disabled={inDetail} accessibilityRole={inDetail ? undefined : 'button'} accessibilityLabel={inDetail ? undefined : 'Open post'} style={styles.body}>
        {post.progressLabel ? (
          <View style={[styles.tag, { backgroundColor: niche.field }]}>
            <TrendIcon color={niche.ink} />
            <Text style={[styles.tagText, { color: niche.ink }]}>Progress · {post.progressLabel}</Text>
          </View>
        ) : null}
        <Text style={[styles.caption, post.kind === 'text' ? styles.captionLarge : null]}>{post.caption}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: cheered }}
          accessibilityLabel={cheered ? 'Cheered' : 'Cheer'}
          onPress={() => actions.toggleCheer(post.id)}
          style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <CheerIcon color={cheered ? niche.accent : colors.textSecondary} />
          <Text style={[styles.actionText, { color: cheered ? niche.accent : colors.textSecondary }]}>{cheered ? 'Cheered' : 'Cheer'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.commentsOff ? 'Comments are off' : `${commentCount} comments`}
          onPress={open}
          disabled={inDetail}
          style={styles.action}>
          <CommentIcon />
          <Text style={[styles.actionText, { fontWeight: '500' }]}>
            {post.commentsOff ? 'Comments off' : `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? 'Saved' : 'Save'}
          onPress={() => actions.toggleSave(post.id)}
          style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <BookmarkIcon size={20} filled={saved} color={saved ? niche.accent : colors.textSecondary} />
          <Text style={[styles.actionText, { color: saved ? niche.accent : colors.textSecondary }]}>{saved ? 'Saved' : 'Save'}</Text>
        </Pressable>
      </View>

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
  card: { paddingBottom: 6, backgroundColor: colors.ground },
  cardDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
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
  playWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
