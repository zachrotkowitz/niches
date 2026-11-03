import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon } from '@/components/icons';
import { MediaPlaceholder } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { colors, NICHES } from '@/lib/theme';
import type { Post } from '@/lib/types';

// Varied tile heights give the Pinterest-style rhythm. Stable per post.
const HEIGHTS = [230, 170, 250, 190, 210, 240, 180, 200];
function tileHeight(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HEIGHTS[h % HEIGHTS.length];
}

/** Two-column grid. Tapping a tile opens the normal post view. */
export function FeedGrid({ posts }: { posts: Post[] }) {
  // Fill whichever column is shorter, so columns stay balanced.
  const cols: Post[][] = [[], []];
  const heights = [0, 0];
  for (const p of posts) {
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(p);
    heights[i] += (p.kind === 'text' ? 150 : tileHeight(p.id)) + 60;
  }
  return (
    <View style={styles.row}>
      {cols.map((col, i) => (
        <View key={i} style={styles.col}>
          {col.map((p) => (
            <GridTile key={p.id} post={p} />
          ))}
        </View>
      ))}
    </View>
  );
}

function GridTile({ post }: { post: Post }) {
  const router = useRouter();
  const { state, usersById, actions } = useStore();
  const niche = NICHES[post.niche];
  const saved = !!state.saves[post.id];
  const title = post.mediaLabel ?? post.caption;
  return (
    <View style={styles.tile}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open post: ${title}`}
        onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        {post.kind === 'text' ? (
          <View style={[styles.textTile, { backgroundColor: niche.field }]}>
            <Text style={[styles.textTileText, { color: niche.ink }]} numberOfLines={5}>{post.caption}</Text>
          </View>
        ) : (
          <MediaPlaceholder post={post} height={tileHeight(post.id)} radius={16} showLabel={false} />
        )}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.user} numberOfLines={1}>{usersById[post.authorId]?.username}</Text>
      </Pressable>
      {post.kind !== 'text' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Saved' : 'Save'}
          accessibilityState={{ selected: saved }}
          onPress={() => actions.toggleSave(post.id)}
          hitSlop={4}
          style={[styles.save, { backgroundColor: saved ? niche.accent : 'rgba(255,255,255,0.94)', top: tileHeight(post.id) - 46 }]}>
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
  textTile: { height: 150, borderRadius: 16, padding: 14, justifyContent: 'flex-end' },
  textTileText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: colors.text, marginTop: 6, paddingHorizontal: 2 },
  user: { fontSize: 12, color: colors.textMuted, marginTop: 2, paddingHorizontal: 2 },
  save: { position: 'absolute', right: 6, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
