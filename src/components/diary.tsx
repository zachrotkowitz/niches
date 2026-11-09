import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { LockIcon, PlusIcon } from '@/components/icons';
import { diaryWords, MAX_FAVORITES, type FavoriteRef, type LogEntry } from '@/lib/diary';
import { logPhoto, postPhoto } from '@/lib/demo-photos';
import { dayLabel } from '@/lib/plans';
import { useSurface, useSurfaceStyles } from '@/components/surface';
import { useNiches, useStore } from '@/lib/store';
import { TOUCH, type NicheId, type Surface } from '@/lib/theme';

function StarShape({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill={fill} stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

/** Read-only stars, e.g. ★★★★☆. */
export function Stars({ rating, size = 14, color }: { rating: number; size?: number; color: string }) {
  const styles = useSurfaceStyles(makeStyles);
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarShape key={i} size={size} fill={i <= rating ? color : 'transparent'} stroke={i <= rating ? color : '#B9BFB8'} />
      ))}
    </View>
  );
}

/** Tap-to-rate stars. Tapping the current rating again clears it. */
export function StarInput({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const styles = useSurfaceStyles(makeStyles);
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={`Rating: ${value} out of 5`} style={styles.starInput}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={`${i} ${i === 1 ? 'star' : 'stars'}`}
          accessibilityState={{ selected: i <= value }}
          onPress={() => onChange(value === i ? 0 : i)}
          style={({ pressed }) => [styles.starButton, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
          <StarShape size={32} fill={i <= value ? color : 'transparent'} stroke={i <= value ? color : '#9AA19B'} />
        </Pressable>
      ))}
    </View>
  );
}

/** One diary entry in a list. */
export function DiaryRow({ log, showPrivacy = false }: { log: LogEntry; showPrivacy?: boolean }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const router = useRouter();
  const niche = useNiches()[log.niche];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${log.title}, ${dayLabel(log.date)}, ${log.rating} stars${log.visibility === 'private' && showPrivacy ? ', private' : ''}`}
      onPress={() => router.push({ pathname: '/log/[id]', params: { id: log.id } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.thumb, { backgroundColor: log.mediaColor ?? niche.field }]}>
        {logPhoto(log) ? <Image source={logPhoto(log)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{log.title}</Text>
        <View style={styles.rowMeta}>
          <Stars rating={log.rating} color={niche.accent} />
          <Text style={styles.rowDate}>{dayLabel(log.date)}</Text>
          {showPrivacy && log.visibility === 'private' ? <LockIcon size={12} color={surface.muted} /> : null}
        </View>
        {log.notes ? <Text style={styles.rowNotes} numberOfLines={1}>{log.notes}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Resolves a Top 4 slot to something displayable. */
export function useFavoriteItem(ref: FavoriteRef) {
  const { state } = useStore();
  if (ref.kind === 'log') {
    const l = state.logs.find((x) => x.id === ref.id);
    return l ? { title: l.title, image: logPhoto(l), color: l.mediaColor, href: { pathname: '/log/[id]' as const, params: { id: l.id } } } : null;
  }
  const p = state.posts.find((x) => x.id === ref.id);
  return p ? { title: p.mediaLabel ?? p.caption, image: postPhoto(p), color: p.mediaColor, href: { pathname: '/post/[id]' as const, params: { id: p.id } } } : null;
}

function FavoriteTile({ refItem, niche }: { refItem: FavoriteRef; niche: NicheId }) {
  const styles = useSurfaceStyles(makeStyles);
  const router = useRouter();
  const item = useFavoriteItem(refItem);
  const n = useNiches()[niche];
  if (!item) return <View style={[styles.tile, { backgroundColor: n.field }]} />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(item.href)} style={{ flex: 1, gap: 4 }}>
      <View style={[styles.tile, { backgroundColor: item.color ?? n.field }]}>
        {item.image ? <Image source={item.image} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
    </Pressable>
  );
}

/** Letterboxd-style Top 4 for one niche. Your own shows empty slots you can fill. */
export function TopFour({ userId, niche, isMe }: { userId: string; niche: NicheId; isMe: boolean }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const router = useRouter();
  const { state } = useStore();
  const n = useNiches()[niche];
  const refs = state.favorites[userId]?.[niche] ?? [];
  if (!refs.length && !isMe) return null;
  const edit = () => router.push({ pathname: '/favorites/[niche]', params: { niche } });
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.topHead}>
        <Text style={[styles.topTitle, { color: n.ink }]}>{diaryWords(niche).top}</Text>
        {isMe ? (
          <Pressable accessibilityRole="button" onPress={edit} style={styles.editButton}>
            <Text style={[styles.editText, { color: surface.active(n) }]}>{refs.length ? 'Edit' : 'Choose'}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.tiles}>
        {Array.from({ length: MAX_FAVORITES }, (_, i) =>
          refs[i] ? (
            <FavoriteTile key={`${refs[i].kind}-${refs[i].id}`} refItem={refs[i]} niche={niche} />
          ) : (
            <Pressable
              key={`empty-${i}`}
              accessibilityRole={isMe ? 'button' : undefined}
              accessibilityLabel={isMe ? `Add to ${diaryWords(niche).top}` : undefined}
              disabled={!isMe}
              onPress={edit}
              style={{ flex: 1 }}>
              {isMe ? (
                <View style={[styles.tile, styles.emptyTile, { borderColor: n.accent }]}>
                  <PlusIcon size={18} color={n.accent} />
                </View>
              ) : (
                <View style={styles.tile} />
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const makeStyles = (sf: Surface) =>
  StyleSheet.create({
  stars: { flexDirection: 'row', gap: 1 },
  starInput: { flexDirection: 'row', gap: 2 },
  starButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  thumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: sf.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDate: { fontSize: 13, color: sf.muted },
  rowNotes: { fontSize: 13, color: sf.body },
  topHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  editButton: { minHeight: 32, justifyContent: 'center', paddingLeft: 12 },
  editText: { fontSize: 14, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { aspectRatio: 0.8, borderRadius: 10, overflow: 'hidden' },
  emptyTile: { borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 11, fontWeight: '600', color: sf.body, lineHeight: 14 },
});
