import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Badges } from '@/components/creator';
import { BookmarkIcon, CommentIcon, HeartIcon, MoreIcon } from '@/components/icons';
import { useSwipeBlocked } from '@/components/niche-swipe';
import { PostCard, VideoPlaceholder } from '@/components/post-card';
import { PostMenu } from '@/components/post-menu';
import { Avatar, MediaPlaceholder } from '@/components/primitives';
import { useSavePost } from '@/components/save';
import { ShopThisBar } from '@/components/shop';
import { Text } from '@/components/text';
import { postAspect, postPhotos } from '@/lib/demo-photos';
import { PhotoPager } from '@/components/photo-pager';
import { shortTitle, timeAgo } from '@/lib/format';
import { hasAccess, postStats, useNiches, useStore } from '@/lib/store';
import { fonts, TOUCH } from '@/lib/theme';
import type { Post } from '@/lib/types';

/**
 * A post in the Home feed (founder's pick, Nov 2026: option B "Gallery").
 * The photo runs nearly edge to edge with the poster's name and Save on it;
 * a serif title, the caption and Like / comments sit underneath. Questions
 * and other text posts are white cards set like a pull quote.
 * Members-only posts you can't open keep the older locked layout.
 */
export function FeedPost({ post }: { post: Post }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[post.niche];
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const savePost = useSavePost();
  const swiping = useSwipeBlocked();

  if (!hasAccess(state, post)) return <PostCard post={post} />;

  const author = usersById[post.authorId];
  const isMine = !!state.me && post.authorId === state.me.id;
  const liked = !!state.cheers[post.id];
  const saved = !!state.saves[post.id];
  const stats = postStats(state, post);
  const mediaWidth = Math.min(width, 640) - 16;
  const aspect = postAspect(post);
  const height = Math.round(mediaWidth * Math.min(1.25, Math.max(0.8, aspect ?? 1.2)));
  const open = () => !swiping() && router.push({ pathname: '/post/[id]', params: { id: post.id } });
  const openAuthor = () => {
    if (swiping()) return;
    if (isMine) router.navigate('/profile');
    else router.push({ pathname: '/user/[id]', params: { id: post.authorId } });
  };
  const { title, body } = titleAndBody(post);
  const meta = [timeAgo(post.createdAt), post.editedAt ? 'edited' : '', post.progressLabel ?? '', post.premium ? 'Members only' : ''].filter(Boolean).join(' · ');
  // Only the author sees numbers.
  const mine = isMine ? [post.hideCheers ? '' : `${stats.cheers} ${stats.cheers === 1 ? 'like' : 'likes'}`, `${stats.saves} ${stats.saves === 1 ? 'save' : 'saves'}`].filter(Boolean).join(' · ') : '';

  const buttons = (
    <View style={styles.buttons}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: liked }}
        accessibilityLabel={liked ? 'Liked' : 'Like'}
        onPress={() => !swiping() && actions.toggleCheer(post.id)}
        style={({ pressed }) => [styles.iconButton, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
        <HeartIcon size={23} filled={liked} color={niche.ink} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={post.commentsOff ? 'Comments are off' : `${stats.comments} comments`} onPress={open} style={styles.comment}>
        <CommentIcon size={22} color={niche.ink} />
        {post.commentsOff ? null : <Text style={[styles.count, { color: niche.ink }]}>{stats.comments}</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Post options" onPress={() => setMenuOpen(true)} style={styles.more}>
        <MoreIcon color={niche.ink} />
      </Pressable>
    </View>
  );

  if (post.kind === 'text') {
    return (
      <View style={styles.quoteCard}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open post" onPress={open}>
          <Text style={[styles.quote, { color: niche.ink }]} numberOfLines={7}>“{post.caption}”</Text>
        </Pressable>
        <View style={styles.quoteFoot}>
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${author?.username ?? 'author'}’s profile`} onPress={openAuthor} style={styles.quoteAuthor}>
            <Avatar user={author} size={36} />
            <View style={{ flexShrink: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.quoteName, { color: niche.ink }]} numberOfLines={1}>{author?.username}</Text>
                <Badges user={author} size={13} />
              </View>
              <Text style={[styles.quoteMeta, { color: niche.inkSoft }]} numberOfLines={1}>{mine ? `${meta} · ${mine}` : meta}</Text>
            </View>
          </Pressable>
          {buttons}
        </View>
        <PostMenu post={post} visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </View>
    );
  }

  return (
    <View style={styles.post}>
      <View style={[styles.media, { height, backgroundColor: post.mediaColor ?? niche.field }]}>
        {post.kind === 'video' ? (
          <VideoPlaceholder post={post} height={height} />
        ) : (
          post.moreImageUris?.length ? (
            <PhotoPager photos={postPhotos(post)} height={height} label={post.mediaLabel ?? 'Post'} onPress={open} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Open post" onPress={open}>
              <MediaPlaceholder post={post} height={height} showLabel={false} />
            </Pressable>
          )
        )}
        {/* A soft shadow at the bottom of the photo keeps the white name readable on any picture. */}
        <View pointerEvents="none" style={styles.scrim}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0.62" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#scrim)" />
          </Svg>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${author?.username ?? 'author'}’s profile`} onPress={openAuthor} style={styles.author}>
          <View style={styles.avatarRing}>
            <Avatar user={author} size={34} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{author?.username}</Text>
              <Badges user={author} size={13} />
            </View>
            <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          accessibilityLabel={saved ? 'Saved' : 'Save'}
          onPress={() => !swiping() && savePost(post.id)}
          hitSlop={4}
          style={({ pressed }) => [styles.save, { backgroundColor: saved ? niche.ink : '#FFFFFF', transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
          <BookmarkIcon size={19} filled={saved} color={saved ? '#FFFFFF' : niche.ink} />
        </Pressable>
      </View>

      <View style={styles.below}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open post" onPress={open} style={styles.text}>
          {title ? (
            <Text style={[styles.title, title.length > 38 ? styles.titleLong : null, { color: niche.ink }]} numberOfLines={3}>
              {title}
            </Text>
          ) : null}
          {body ? <Text style={[styles.caption, { color: niche.ink }]} numberOfLines={2}>{body}</Text> : null}
          {mine ? <Text style={[styles.mine, { color: niche.inkSoft }]}>{mine}</Text> : null}
        </Pressable>
        {buttons}
      </View>
      <ShopThisBar postId={post.id} />
      <PostMenu post={post} visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

/**
 * The serif title and the caption under it. Older posts stored a title that
 * was cut mid-word ("homemade buffal"); those get a fresh title from the
 * caption, ending at a word. When the caption only repeats the title, it's
 * left out so the same words don't show twice.
 */
function titleAndBody(post: Post): { title: string; body: string } {
  const caption = post.caption.trim();
  let title = (post.previewTitle || post.mediaLabel || '').trim();
  const cutMidWord = !!title && caption.startsWith(title) && caption.length > title.length && /[\p{L}\p{N}]/u.test(caption[title.length]);
  if (cutMidWord) title = shortTitle(caption, 80);
  if (!title) return { title: '', body: caption };
  const bare = title.replace(/[.!?…]+$/, '');
  const body = caption.startsWith(bare) ? caption.slice(bare.length).replace(/^[\s.,;:!?…—-]+/, '') : caption;
  return { title, body };
}

const styles = StyleSheet.create({
  post: { marginBottom: 22 },
  media: { marginHorizontal: 8, borderRadius: 28, overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  author: { position: 'absolute', left: 12, bottom: 10, right: 70, minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarRing: { borderRadius: 19, borderWidth: 1.5, borderColor: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  save: { position: 'absolute', right: 12, bottom: 12, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  below: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 20, paddingRight: 4, paddingTop: 10 },
  text: { flex: 1, minWidth: 0, paddingTop: 4, gap: 4 },
  title: { fontFamily: fonts.display, fontSize: 27, lineHeight: 29, letterSpacing: -0.3 },
  /** Longer titles step down a size so they fit in two or three lines instead of being cut. */
  titleLong: { fontSize: 23, lineHeight: 26 },
  caption: { fontSize: 14, lineHeight: 20 },
  mine: { fontSize: 13, fontWeight: '600' },
  buttons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  comment: { minWidth: TOUCH, height: TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  count: { fontSize: 14, fontWeight: '600' },
  more: { width: 36, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  quoteCard: { marginHorizontal: 8, marginBottom: 22, paddingTop: 20, paddingLeft: 18, paddingRight: 6, paddingBottom: 8, borderRadius: 28, backgroundColor: '#FFFFFF' },
  quote: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34, letterSpacing: -0.3, paddingRight: 12 },
  quoteFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  quoteAuthor: { flex: 1, minWidth: 0, minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quoteName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  quoteMeta: { fontSize: 12 },
});
