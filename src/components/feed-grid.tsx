import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { BookmarkIcon, LockIcon } from '@/components/icons';
import { useSwipeBlocked } from '@/components/niche-swipe';
import { useSavePost } from '@/components/save';
import { MediaPlaceholder } from '@/components/primitives';
import { useSurface } from '@/components/surface';
import { hasAccess, useNiches, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Post, PreviewShape } from '@/lib/types';

// Varied tile heights give the Pinterest-style rhythm. Stable per post.
const HEIGHTS = [230, 170, 250, 190, 210, 240, 180, 200];
const SHAPES: Record<PreviewShape, number> = { tall: 250, square: 172, short: 130 };
const TEXT_TILE = 150;
/** Width of the niche-color border on mixed-niche grids (Discover, Saved). */
export const NICHE_BORDER = 3;

export function tileHeight(post: Post): number {
  if (post.previewShape) return SHAPES[post.previewShape];
  if (post.kind === 'text') return TEXT_TILE;
  let h = 0;
  for (let i = 0; i < post.id.length; i++) h = (h * 31 + post.id.charCodeAt(i)) >>> 0;
  return HEIGHTS[h % HEIGHTS.length];
}

export function tileTitle(post: Post): string {
  return post.previewTitle || post.mediaLabel || post.caption;
}

/**
 * Two-column grid. Tapping a tile opens the normal post view.
 * `nicheBorders` outlines each tile in its niche's color, for grids that mix niches.
 */
export function FeedGrid({ posts, nicheBorders = false }: { posts: Post[]; nicheBorders?: boolean }) {
  // Fill whichever column is shorter, so columns stay balanced.
  const cols: Post[][] = [[], []];
  const heights = [0, 0];
  for (const p of posts) {
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(p);
    heights[i] += tileHeight(p) + 60;
  }
  return (
    <View style={styles.row}>
      {cols.map((col, i) => (
        <View key={i} style={styles.col}>
          {col.map((p) => (
            <GridTile key={p.id} post={p} nicheBorder={nicheBorders} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function GridTile({ post, nicheBorder = false, interactive = true }: { post: Post; nicheBorder?: boolean; interactive?: boolean }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = useNiches()[post.niche];
  const surface = useSurface();
  const saved = !!state.saves[post.id];
  const savePost = useSavePost();
  const swiping = useSwipeBlocked();
  const locked = !hasAccess(state, post);
  const title = tileTitle(post);
  const height = tileHeight(post);
  const inset = nicheBorder ? NICHE_BORDER : 0;
  const frame = nicheBorder ? { borderWidth: NICHE_BORDER, borderColor: niche.accent, borderRadius: 18 } : { borderRadius: 16 };

  return (
    <View style={styles.tile}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${niche.label} post: ${title}`}
        disabled={!interactive}
        onPress={() => !swiping() && router.push({ pathname: '/post/[id]', params: { id: post.id } })}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <View style={[frame, { overflow: 'hidden' }]}>
          {post.kind === 'text' ? (
            <View style={[styles.textTile, { height: height - inset * 2, backgroundColor: niche.field }]}>
              <Text style={[styles.textTileText, { color: niche.ink }]} numberOfLines={5}>{post.caption}</Text>
            </View>
          ) : (
            <MediaPlaceholder post={post} height={height - inset * 2} radius={nicheBorder ? 15 : 16} showLabel={false} />
          )}
          {locked ? (
            <View style={styles.lockVeil}>
              <View style={styles.lockPill}>
                <LockIcon size={12} color="#FFFFFF" />
                <Text style={styles.lockText}>Members</Text>
              </View>
            </View>
          ) : null}
        </View>
        <Text style={[styles.title, { color: surface.text }]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.user, { color: surface.muted }]} numberOfLines={1}>{usersById[post.authorId]?.username}</Text>
      </Pressable>
      {interactive && post.kind !== 'text' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Saved' : 'Save'}
          accessibilityState={{ selected: saved }}
          onPress={() => !swiping() && savePost(post.id)}
          hitSlop={4}
          style={[styles.save, { backgroundColor: saved ? niche.accent : 'rgba(255,255,255,0.94)', top: height - 46 - inset, right: 6 + inset }]}>
          <BookmarkIcon size={17} filled={saved} color={saved ? '#FFFFFF' : colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 12, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0, gap: 14 },
  tile: { position: 'relative' },
  textTile: { padding: 14, justifyContent: 'flex-end' },
  textTileText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: colors.text, marginTop: 6, paddingHorizontal: 2 },
  user: { fontSize: 12, color: colors.textMuted, marginTop: 2, paddingHorizontal: 2 },
  lockVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,22,26,0.5)', alignItems: 'center', justifyContent: 'center' },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,22,26,0.8)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  lockText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  save: { position: 'absolute', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
