import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LockIcon, PlusIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { savesLabel } from '@/lib/boards';
import { postPhoto } from '@/lib/demo-photos';
import { useNiches } from '@/lib/store';
import { fonts } from '@/lib/theme';
import type { Post } from '@/lib/types';

/** Two cards side by side with the page's 20px gutters, like Explore by niche. */
export function useCardWidth() {
  const { width } = useWindowDimensions();
  return Math.floor((Math.min(width, 520) - 40 - 12) / 2);
}

/**
 * Three-photo collage (one big, two small), the same shape as Discover's
 * Explore by niche cards. Text posts and posts without a photo show as a tile
 * in their niche's light color with the start of the caption.
 */
export function Collage({ posts, height = 146, radius = 18 }: { posts: Post[]; height?: number; radius?: number }) {
  const surface = useSurface();
  const niches = useNiches();
  const cell = (p: Post | undefined, small: boolean) => {
    if (!p) return <View style={[StyleSheet.absoluteFill, { backgroundColor: surface.line }]} />;
    const photo = postPhoto(p);
    if (photo) return <Image source={photo} contentFit="cover" style={[StyleSheet.absoluteFill, { backgroundColor: p.mediaColor }]} />;
    const n = niches[p.niche];
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.mediaColor ?? n.field, padding: small ? 6 : 10, justifyContent: 'flex-end' }]}>
        {p.kind === 'text' ? <Text style={{ color: n.ink, fontSize: small ? 10 : 13, fontWeight: '600', lineHeight: small ? 13 : 17 }} numberOfLines={small ? 3 : 5}>{p.caption}</Text> : null}
      </View>
    );
  };
  return (
    <View style={[styles.collage, { height, borderRadius: radius, backgroundColor: surface.ground }]}>
      <View style={{ flex: 2 }}>{cell(posts[0], false)}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flex: 1 }}>{cell(posts[1], true)}</View>
        <View style={{ flex: 1 }}>{cell(posts[2], true)}</View>
      </View>
    </View>
  );
}

/** A board in a grid: collage, name in the serif, then "8 saves" and a lock if it's private. */
export function BoardCard({ name, posts, count, isPrivate, onPress, width }: { name: string; posts: Post[]; count: number; isPrivate?: boolean; onPress: () => void; width: number }) {
  const surface = useSurface();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${savesLabel(count)}${isPrivate ? ', private' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [{ width, gap: 6 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {count ? (
        <Collage posts={posts} />
      ) : (
        <View style={[styles.empty, { borderColor: surface.line }]}>
          <Text style={[styles.emptyText, { color: surface.muted }]}>Nothing here yet</Text>
        </View>
      )}
      <Text style={[styles.name, { color: surface.text }]} numberOfLines={1}>{name}</Text>
      <View style={styles.meta}>
        {isPrivate ? <LockIcon size={11} color={surface.muted} /> : null}
        <Text style={[styles.metaText, { color: surface.muted }]}>{savesLabel(count)}</Text>
      </View>
    </Pressable>
  );
}

export function NewBoardCard({ onPress, width }: { onPress: () => void; width: number }) {
  const surface = useSurface();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="New board" onPress={onPress} style={({ pressed }) => [{ width, gap: 6 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.newCard, { borderColor: surface.muted }]}>
        <View style={[styles.plus, { backgroundColor: surface.text }]}>
          <PlusIcon size={18} color={surface.ground} />
        </View>
      </View>
      <Text style={[styles.name, { color: surface.text }]}>New board</Text>
      <Text style={[styles.metaText, { color: surface.muted }]}>Private until you share it</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  collage: { overflow: 'hidden', flexDirection: 'row', gap: 2 },
  empty: { height: 146, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  emptyText: { fontSize: 13, fontWeight: '600' },
  newCard: { height: 146, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  plus: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display, fontSize: 22, lineHeight: 25 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -4 },
  metaText: { fontSize: 12 },
});
