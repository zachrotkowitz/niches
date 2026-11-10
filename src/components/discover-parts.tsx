import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ComponentRef, Ref } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions, type TextInputProps } from 'react-native';

import { Badges } from '@/components/creator';
import { ChevronLeftIcon, SearchIcon } from '@/components/icons';
import { Avatar } from '@/components/primitives';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { listingPhoto, postPhoto } from '@/lib/demo-photos';
import { formatPrice, type Listing } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { BODY_FONTS, fonts, TOUCH, type Niche } from '@/lib/theme';
import { TOPICS } from '@/lib/topics';
import type { Post, User } from '@/lib/types';

/**
 * Discover's search bar: a white pill with a soft shadow. The placeholder is
 * in the italic serif; what you type is in the body font.
 */
export function SearchBar({ focused, onClear, compact, value, style, ref, ...rest }: Omit<TextInputProps, 'ref'> & { focused?: boolean; onClear?: () => void; compact?: boolean; ref?: Ref<ComponentRef<typeof TextInput>> }) {
  const surface = useSurface();
  const empty = !value;
  return (
    <View
      style={[
        styles.search,
        compact ? styles.searchCompact : null,
        { borderColor: focused ? surface.text : 'rgba(31,26,20,0.10)', borderWidth: focused ? 2 : 1 },
        compact ? null : styles.searchShadow,
      ]}>
      <SearchIcon size={compact ? 18 : 20} color={surface.text} />
      <TextInput
        ref={ref}
        value={value}
        placeholderTextColor={surface.muted}
        selectionColor={surface.text}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[
          styles.searchInput,
          { color: surface.text },
          // The pill already shows focus (its border darkens), so no browser outline inside it.
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          empty ? { fontFamily: fonts.displayItalic, fontSize: compact ? 19 : 20 } : { fontFamily: BODY_FONTS['500'], fontSize: compact ? 17 : 18 },
          style,
        ]}
        {...rest}
      />
      {onClear && !empty ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={onClear} hitSlop={10} style={[styles.clear, { backgroundColor: surface.line }]}>
          <Text style={[styles.clearText, { color: surface.text }]}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** "‹ Discover" at the top of pages opened from Discover. */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  const surface = useSurface();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${label}`} onPress={onPress} style={styles.back}>
      <ChevronLeftIcon size={22} color={surface.text} />
      <Text style={[styles.backText, { color: surface.text }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const surface = useSurface();
  return (
    <View style={styles.sectionRow}>
      <Text accessibilityRole="header" style={[styles.section, { color: surface.text }]}>{children}</Text>
      {right}
    </View>
  );
}

/** Small uppercase label, like "Week of Nov 9" or "Recent". */
export function Eyebrow({ children, style }: { children: React.ReactNode; style?: object }) {
  const surface = useSurface();
  return <Text style={[styles.eyebrow, { color: surface.muted }, style]}>{children}</Text>;
}

/** The italic line where a Discover list ends. */
export function EndNote({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  const surface = useSurface();
  return (
    <View style={[styles.end, { borderTopColor: surface.line }]}>
      <Text style={[styles.endTitle, { color: surface.text }]}>{title}</Text>
      {body ? <Text style={[styles.endBody, { color: surface.muted }]}>{body}</Text> : null}
      {children}
    </View>
  );
}

function topicLine(niche: Niche): string {
  const labels = TOPICS[niche.id].slice(0, 3).map((t, i) => (i === 0 ? t.label : t.label.toLowerCase()));
  return labels.join(', ');
}

/** Explore by niche: a three-photo collage outlined in the niche's color. */
export function NicheCard({ niche, posts, onPress, notified }: { niche: Niche; posts: Post[]; onPress: () => void; notified?: boolean }) {
  const surface = useSurface();
  const { width } = useWindowDimensions();
  const cardW = Math.floor((Math.min(width, 520) - 40 - 12) / 2);
  const photos = posts.map((p) => postPhoto(p)).filter(Boolean).slice(0, 3);
  const open = niche.open;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? `Explore ${niche.label}` : `${niche.label}, opening soon. ${notified ? 'You’ll be notified.' : 'Tap to get notified.'}`}
      onPress={onPress}
      style={({ pressed }) => [{ width: cardW, gap: 6 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {open ? (
        <View style={[styles.collage, { borderColor: niche.accent, backgroundColor: niche.accent }]}>
          <View style={{ flex: 2 }}>{photos[0] ? <Image source={photos[0]} contentFit="cover" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: niche.field }]} />}</View>
          <View style={{ flex: 1, gap: 2 }}>
            {[1, 2].map((i) => (
              <View key={i} style={{ flex: 1 }}>
                {photos[i] ? <Image source={photos[i]} contentFit="cover" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: niche.field }]} />}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.soon, { borderColor: niche.accent, backgroundColor: niche.field }]}>
          <Text style={[styles.soonText, { color: niche.ink }]}>Opening soon</Text>
        </View>
      )}
      <Text style={[styles.cardName, { color: surface.text }]}>{niche.label}</Text>
      <Text style={[styles.cardSub, { color: surface.muted }]} numberOfLines={1}>
        {open ? topicLine(niche) : notified ? 'We’ll let you know' : 'Tap to get notified'}
      </Text>
    </Pressable>
  );
}

/** A tile in the "This week's favorites" rail. */
export function RailTile({ post }: { post: Post }) {
  const router = useRouter();
  const surface = useSurface();
  const { usersById } = useStore();
  const niche = useNiches()[post.niche];
  const photo = postPhoto(post);
  const title = post.previewTitle || post.mediaLabel || post.caption;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${niche.label} post: ${title}`}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={({ pressed }) => [{ width: 150 }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.railFrame, { borderColor: niche.accent, backgroundColor: post.mediaColor ?? niche.field }]}>
        {photo ? (
          <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: niche.field, padding: 12, justifyContent: 'flex-end' }]}>
            <Text style={{ color: niche.ink, fontSize: 14, fontWeight: '600', lineHeight: 18 }} numberOfLines={6}>{post.caption}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tileTitle, { color: surface.text }]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.tileSub, { color: surface.muted }]} numberOfLines={1}>{usersById[post.authorId]?.username}</Text>
    </Pressable>
  );
}

/** Shop tile for Discover: the price sits in the text under the photo, not on a tag. */
export function ShopTile({ listing, width }: { listing: Listing; width: number }) {
  const router = useRouter();
  const surface = useSurface();
  const { usersById } = useStore();
  const niche = useNiches()[listing.niche];
  const photo = listingPhoto(listing);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.priceCents)}, from ${usersById[listing.sellerId]?.username ?? 'a seller'}`}
      onPress={() => router.push({ pathname: '/shop/[id]', params: { id: listing.id } })}
      style={({ pressed }) => [{ width }, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.shopFrame, { borderColor: niche.accent, backgroundColor: listing.mediaColor }]}>
        {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <Text style={[styles.tileTitle, { color: surface.text }]} numberOfLines={2}>{listing.title}</Text>
      <Text style={[styles.tileSub, { color: surface.muted }]} numberOfLines={1}>
        <Text style={{ color: surface.text, fontWeight: '700' }}>{formatPrice(listing.priceCents)}</Text>
        {listing.format === 'digital' ? ' · Digital' : ''} · {usersById[listing.sellerId]?.username}
      </Text>
    </Pressable>
  );
}

/** A person with a Follow button. Neutral colors on the app background; ink on a niche flood. */
export function PersonRow({ user, subtitle, serifSubtitle, thumb, onPress }: { user: User; subtitle?: string; serifSubtitle?: boolean; thumb?: Post; onPress?: () => void }) {
  const router = useRouter();
  const surface = useSurface();
  const { state, actions } = useStore();
  const following = !!state.following[user.id];
  const photo = thumb ? postPhoto(thumb) : undefined;
  return (
    <View style={[styles.person, { borderTopColor: surface.line }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${user.displayName}’s profile`}
        onPress={onPress ?? (() => router.push({ pathname: '/user/[id]', params: { id: user.id } }))}
        style={styles.personMain}>
        <Avatar user={user} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[styles.personName, { color: surface.text }]} numberOfLines={1}>{user.displayName}</Text>
            <Badges user={user} size={14} />
          </View>
          <Text style={serifSubtitle ? [styles.personSerif, { color: surface.body }] : [styles.personSub, { color: surface.muted }]} numberOfLines={1}>
            {subtitle ?? user.username}
          </Text>
        </View>
        {photo ? <Image source={photo} contentFit="cover" style={styles.personThumb} accessibilityElementsHidden importantForAccessibility="no" /> : null}
      </Pressable>
      {photo ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
          accessibilityLabel={following ? `Following ${user.username}` : `Follow ${user.username}`}
          onPress={() => actions.toggleFollow(user.id)}
          hitSlop={4}
          style={({ pressed }) => [
            styles.follow,
            following ? { borderColor: surface.line, borderWidth: 1.5 } : { backgroundColor: surface.text },
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}>
          <Text style={[styles.followText, { color: following ? surface.text : surface.flood ? '#FFFFFF' : surface.ground }]}>{following ? 'Following' : 'Follow'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 27, paddingLeft: 18, paddingRight: 12, backgroundColor: '#FFFFFF' },
  searchCompact: { height: 50, borderRadius: 25, paddingLeft: 16 },
  searchShadow: { shadowColor: '#1F1A14', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  searchInput: { flex: 1, minWidth: 0, height: '100%', paddingVertical: 0 },
  clear: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, lineHeight: 18, fontWeight: '600' },
  back: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingRight: 10 },
  backText: { fontSize: 15, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  section: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30, letterSpacing: -0.3, flexShrink: 1 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  end: { marginHorizontal: 20, marginTop: 30, paddingTop: 16, borderTopWidth: 1, gap: 4 },
  endTitle: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 29 },
  endBody: { fontSize: 14, lineHeight: 20 },
  collage: { height: 146, borderWidth: 3, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', gap: 2 },
  soon: { height: 146, borderWidth: 3, borderStyle: 'dashed', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  soonText: { fontSize: 14, fontWeight: '700' },
  cardName: { fontFamily: fonts.displayItalic, fontSize: 24, lineHeight: 26 },
  cardSub: { fontSize: 12, marginTop: -4 },
  railFrame: { height: 200, borderWidth: 3, borderRadius: 18, overflow: 'hidden' },
  shopFrame: { height: 150, borderWidth: 3, borderRadius: 18, overflow: 'hidden' },
  tileTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18, marginTop: 7, paddingHorizontal: 2 },
  tileSub: { fontSize: 12, marginTop: 2, paddingHorizontal: 2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  personMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  personName: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  personSub: { fontSize: 13, marginTop: 1 },
  personSerif: { fontFamily: fonts.displayItalic, fontSize: 17, lineHeight: 21, marginTop: 1 },
  personThumb: { width: 64, height: 64, borderRadius: 12 },
  follow: { minHeight: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  followText: { fontSize: 14, fontWeight: '700' },
});
