import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/diary';
import { ChevronLeftIcon, LockIcon, MoreIcon } from '@/components/icons';
import { Eyebrow } from '@/components/discover-parts';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Sheet } from '@/components/sheet';
import { useToast, type ToastAction } from '@/components/toast';
import { diaryWords, MAX_FAVORITES } from '@/lib/diary';
import { dayLabel } from '@/lib/plans';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { logPhoto, postPhoto } from '@/lib/demo-photos';
import { parseDay } from '@/lib/plans';
import { colors, fonts, groundSurface, TOUCH } from '@/lib/theme';

/** One diary entry. The owner can change who sees it, share it, add it to their Top 4, or delete it. */
export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [menu, setMenu] = useState(false);
  const appGround = useAppGround();
  const log = state.logs.find((l) => l.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  const isMine = !!log && log.userId === state.me?.id;

  if (!log || (!isMine && log.visibility !== 'profile')) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }]}>
        <Text style={{ fontSize: 17, color: colors.text }}>This diary entry isn’t available.</Text>
        <Button label="Go back" onPress={goBack} />
      </View>
    );
  }

  const niche = niches[log.niche];

  // Messages about this niche come in its dark color (founder, Nov 24 2026).

  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const words = diaryWords(log.niche);
  const owner = usersById[log.userId];
  const source = log.postId ? state.posts.find((p) => p.id === log.postId) : undefined;
  const favs = state.favorites[log.userId]?.[log.niche] ?? [];
  const inTop = favs.some((r) => r.kind === 'log' && r.id === log.id);


  const ground = groundSurface(appGround);
  // "Your 3rd time making it": other entries of yours from the same post, or with the same name.
  const tries = state.logs.filter((l) => l.userId === log.userId && (log.postId ? l.postId === log.postId : l.title.trim().toLowerCase() === log.title.trim().toLowerCase()) && (l.date < log.date || (l.date === log.date && l.createdAt <= log.createdAt))).length;
  const nth = tries === 2 ? '2nd' : tries === 3 ? '3rd' : `${tries}th`;
  const photo = logPhoto(log);
  const date = parseDay(log.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SurfaceProvider value={ground}>
    <View style={[styles.screen, { backgroundColor: ground.ground }]}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.iconButton}>
          <ChevronLeftIcon color={ground.text} />
        </Pressable>
        {isMine ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Entry options" onPress={() => setMenu(true)} style={styles.iconButton}>
            <MoreIcon color={ground.text} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 10 }}>
        <Eyebrow>{`${words.diary} · ${date}`}</Eyebrow>
        <DisplayText size={42} color={ground.text}>{log.title}</DisplayText>
        <View style={styles.starRow}>
          <Stars rating={log.rating} size={22} color={niche.accent} />
          {tries > 1 ? <Text style={[styles.tries, { color: ground.muted }]}>{isMine ? 'Your' : 'Their'} {nth} time {log.niche === 'photography' ? 'shooting' : 'making'} it</Text> : null}
        </View>
        <View style={[styles.photo, { backgroundColor: log.mediaColor ?? niche.field }]}>
          {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Photo: ${log.title}`} /> : null}
        </View>
        {log.notes ? <Text style={[styles.quote, { color: ground.text }]}>“{log.notes}”</Text> : null}

        <View style={[styles.rows, { borderTopColor: ground.line }]}>
          {source ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`See original post: ${source.mediaLabel ?? source.caption}`}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: source.id } })}
              style={({ pressed }) => [styles.row, { borderBottomColor: ground.line, opacity: pressed ? 0.7 : 1 }]}>
              <View style={[styles.rowThumb, { backgroundColor: source.mediaColor ?? niche.field }]}>
                {postPhoto(source) ? <Image source={postPhoto(source)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[styles.rowTitle, { color: ground.text }]}>See original post</Text>
                <Text style={[styles.rowSub, { color: ground.muted }]} numberOfLines={1}>
                  {source.mediaLabel ?? source.caption} · {usersById[source.authorId]?.username}
                </Text>
              </View>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <ChevronLeftIcon size={18} color={ground.muted} />
              </View>
            </Pressable>
          ) : null}
          {isMine ? (
            <View style={[styles.row, { borderBottomColor: ground.line }]}>
              <View style={styles.rowIcon}>
                {log.visibility === 'private' ? <LockIcon size={18} color={ground.text} /> : <Avatar user={owner} size={26} />}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[styles.rowTitle, { color: ground.text }]}>{log.visibility === 'private' ? 'Just you' : 'On your profile'}</Text>
                <Text style={[styles.rowSub, { color: ground.muted }]}>{log.visibility === 'private' ? 'Tap ⋯ to show it on your profile' : 'Anyone on your profile’s Diary tab can see it'}</Text>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="link" onPress={() => owner && router.push({ pathname: '/user/[id]', params: { id: owner.id } })} style={[styles.row, { borderBottomColor: ground.line }]}>
              <View style={styles.rowIcon}><Avatar user={owner} size={26} /></View>
              <Text style={[styles.rowTitle, { color: ground.text, flex: 1 }]}>{owner?.username}’s diary</Text>
            </Pressable>
          )}
        </View>

        {isMine ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 22 }}>
            {log.sharedPostId ? (
              <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/post/[id]', params: { id: log.sharedPostId! } })} style={styles.link}>
                <Text style={[styles.linkText, { color: ground.text }]}>See the post you shared</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: inTop }}
              disabled={inTop}
              onPress={() => {
                if (!state.me) return;
                if (favs.length < MAX_FAVORITES) {
                  actions.setFavorites(state.me.id, log.niche, [...favs, { kind: 'log', id: log.id }]);
                  toast(`Added to your ${words.top}`);
                } else {
                  router.push({ pathname: '/favorites/[niche]', params: { niche: log.niche } });
                }
              }}
              style={styles.link}>
              <Text style={[styles.linkText, { color: inTop ? ground.muted : ground.text, textDecorationLine: inTop ? 'none' : 'underline' }]}>
                {inTop ? `In your ${words.top}` : favs.length >= MAX_FAVORITES ? `Swap into your ${words.top}` : `Add to your ${words.top}`}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          {
            label: 'Edit entry',
            detail: source ? 'Only changes your diary, not the original post.' : undefined,
            onPress: () => {
              setMenu(false);
              router.push({ pathname: '/log/new', params: { edit: log.id } });
            },
          },
          {
            label: log.visibility === 'private' ? 'Show on my profile' : 'Make private',
            detail: log.visibility === 'private' ? 'It appears in the Diary tab on your profile.' : 'Only you will see it.',
            onPress: () => {
              setMenu(false);
              actions.updateLog(log.id, { visibility: log.visibility === 'private' ? 'profile' : 'private' });
              toast(log.visibility === 'private' ? 'Now on your profile' : 'Now private');
            },
          },
          {
            label: 'Delete entry',
            destructive: true,
            detail: log.sharedPostId ? 'The post you shared stays up; delete it separately.' : undefined,
            onPress: () => {
              setMenu(false);
              actions.deleteLog(log.id);
              toast('Entry deleted');
              goBack();
            },
          },
        ]}
      />
    </View>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  tries: { fontSize: 13 },
  photo: { height: 300, borderRadius: 22, overflow: 'hidden', marginTop: 6 },
  quote: { fontFamily: fonts.displayItalic, fontSize: 23, lineHeight: 28, marginTop: 6 },
  rows: { borderTopWidth: StyleSheet.hairlineWidth * 2, marginTop: 6 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  rowThumb: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden' },
  rowIcon: { width: 40, alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 13 },
  link: { minHeight: TOUCH, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
