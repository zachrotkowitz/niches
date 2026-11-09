import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Path } from 'react-native-svg';

import { LockIcon, PlusIcon } from '@/components/icons';
import { ReorderRow } from '@/components/reorder-row';
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

/** "3.5" → "3½". Ratings go from ½ to 5 in half-star steps. */
export function formatRating(r: number): string {
  const whole = Math.floor(r);
  return r % 1 ? `${whole ? whole : ''}½` : String(whole);
}

/** One star filled to `fill` (0, 0.5 or 1): a half star is the filled star cut at the middle. */
function PartStar({ size, fill, color, empty }: { size: number; fill: number; color: string; empty: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <StarShape size={size} fill="transparent" stroke={fill > 0 ? color : empty} />
      {fill > 0 ? (
        <View style={{ position: 'absolute', left: 0, top: 0, width: size * fill, height: size, overflow: 'hidden' }}>
          <StarShape size={size} fill={color} stroke={color} />
        </View>
      ) : null}
    </View>
  );
}

const starFill = (rating: number, i: number) => Math.max(0, Math.min(1, rating - (i - 1)));

/** Read-only stars, with halves, e.g. ★★★½☆. */
export function Stars({ rating, size = 14, color }: { rating: number; size?: number; color: string }) {
  const styles = useSurfaceStyles(makeStyles);
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <PartStar key={i} size={size} fill={starFill(rating, i)} color={color} empty="#B9BFB8" />
      ))}
    </View>
  );
}

/**
 * Tap-to-rate stars, like Letterboxd: tap a star for a full star, tap the
 * same star again for a half star (tap once more to go back to full).
 */
export function StarInput({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const tap = (i: number) => onChange(value === i ? i - 0.5 : i);
  return (
    <View style={{ gap: 4 }}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Rating"
        accessibilityValue={{ text: value ? `${value} out of 5 stars` : 'Not rated' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onChange(Math.max(0.5, Math.min(5, value + (e.nativeEvent.actionName === 'increment' ? 0.5 : -0.5))))}
        style={styles.starInput}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`${i} ${i === 1 ? 'star' : 'stars'}`}
            onPress={() => tap(i)}
            style={({ pressed }) => [styles.starButton, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
            <PartStar size={32} fill={starFill(value, i)} color={color} empty="#9AA19B" />
          </Pressable>
        ))}
      </View>
      <View style={styles.ratingRow}>
        <Text style={[styles.ratingText, { color: surface.muted }]}>
          {value ? `${formatRating(value)} ${value <= 1 ? 'star' : 'stars'}` : 'Tap a star twice for a half star'}
        </Text>
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear rating" onPress={() => onChange(0)} hitSlop={10}>
            <Text style={[styles.ratingText, { color: surface.text, fontWeight: '700' }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
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
      accessibilityLabel={`${log.title}, ${dayLabel(log.date)}, ${formatRating(log.rating)} stars${log.visibility === 'private' && showPrivacy ? ', private' : ''}`}
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

/** A Top 4 tile without its own tap handling, for the draggable row. */
function FavoriteTileBody({ refItem, niche }: { refItem: FavoriteRef; niche: NicheId }) {
  const styles = useSurfaceStyles(makeStyles);
  const item = useFavoriteItem(refItem);
  const n = useNiches()[niche];
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <View style={[styles.tile, { backgroundColor: item?.color ?? n.field }]}>
        {item?.image ? <Image source={item.image} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>{item?.title ?? ''}</Text>
    </View>
  );
}

const refKey = (r: FavoriteRef) => `${r.kind}:${r.id}`;

/** Letterboxd-style Top 4 for one niche. Your own shows empty slots you can fill, and you can hold and drag to reorder. */
export function TopFour({ userId, niche, isMe }: { userId: string; niche: NicheId; isMe: boolean }) {
  const styles = useSurfaceStyles(makeStyles);
  const surface = useSurface();
  const router = useRouter();
  const { state, actions } = useStore();
  const n = useNiches()[niche];
  const refs = state.favorites[userId]?.[niche] ?? [];
  if (!refs.length && !isMe) return null;
  const edit = () => router.push({ pathname: '/favorites/[niche]', params: { niche } });
  const titleOf = (r: FavoriteRef) =>
    r.kind === 'log' ? state.logs.find((l) => l.id === r.id)?.title ?? '' : (() => { const p = state.posts.find((x) => x.id === r.id); return p ? p.mediaLabel ?? p.caption : ''; })();
  const open = (r: FavoriteRef) =>
    r.kind === 'log' ? router.push({ pathname: '/log/[id]', params: { id: r.id } }) : router.push({ pathname: '/post/[id]', params: { id: r.id } });
  const emptySlot = (i: number) => (
    <Pressable key={`empty-${i}`} accessibilityRole="button" accessibilityLabel={`Add to ${diaryWords(niche).top}`} onPress={edit} style={{ flex: 1 }}>
      <View style={[styles.tile, styles.emptyTile, { borderColor: n.accent }]}>
        <PlusIcon size={18} color={n.accent} />
      </View>
    </Pressable>
  );
  // Your own Top 4 with two or more picks: hold and drag a tile to change the order.
  if (isMe && refs.length >= 2) {
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.topHead}>
          <Text style={[styles.topTitle, { color: n.ink }]}>{diaryWords(niche).top}</Text>
          <Pressable accessibilityRole="button" onPress={edit} style={styles.editButton}>
            <Text style={[styles.editText, { color: surface.active(n) }]}>Edit</Text>
          </Pressable>
        </View>
        <ReorderRow
          slots={MAX_FAVORITES}
          itemHeight={(w) => w * 1.25 + 32}
          items={refs.map((r) => ({ key: refKey(r), label: titleOf(r), onPress: () => open(r), render: () => <FavoriteTileBody refItem={r} niche={niche} /> }))}
          onReorder={(keys) => {
            const next = keys.map((k) => refs.find((r) => refKey(r) === k)).filter((r): r is FavoriteRef => !!r);
            if (next.map(refKey).join() !== refs.map(refKey).join()) actions.setFavorites(userId, niche, next);
          }}
          renderEmpty={emptySlot}
        />
        <Text style={[styles.dragHint, { color: surface.muted }]}>Hold and drag to change the order</Text>
      </View>
    );
  }
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
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 6 },
  ratingText: { fontSize: 13, fontWeight: '600' },
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
  dragHint: { fontSize: 12, fontWeight: '500' },
  tile: { aspectRatio: 0.8, borderRadius: 10, overflow: 'hidden' },
  emptyTile: { borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 11, fontWeight: '600', color: sf.body, lineHeight: 14 },
});
