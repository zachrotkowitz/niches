import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/diary';
import { ChevronLeftIcon, LockIcon, MoreIcon } from '@/components/icons';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { diaryWords, MAX_FAVORITES } from '@/lib/diary';
import { dayLabel } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

/** One diary entry. The owner can change who sees it, share it, add it to their Top 4, or delete it. */
export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [menu, setMenu] = useState(false);
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
  const words = diaryWords(log.niche);
  const owner = usersById[log.userId];
  const source = log.postId ? state.posts.find((p) => p.id === log.postId) : undefined;
  const favs = state.favorites[log.userId]?.[log.niche] ?? [];
  const inTop = favs.some((r) => r.kind === 'log' && r.id === log.id);

  const shareNow = () => {
    if (!state.me) return;
    const postId = actions.createPost({
      authorId: state.me.id,
      niche: log.niche,
      kind: log.imageUri ? 'photo' : 'text',
      caption: `${words.did}: ${log.title}. ${'★'.repeat(log.rating)}${log.notes ? `\n${log.notes}` : ''}`,
      imageUri: log.imageUri,
      mediaColor: log.imageUri ? '#E3E5E1' : undefined,
      mediaLabel: log.imageUri ? log.title : undefined,
    });
    actions.updateLog(log.id, { sharedPostId: postId });
    toast(`Shared to ${niche.label}`);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.iconButton}>
          <ChevronLeftIcon color={colors.text} />
        </Pressable>
        {isMine ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Entry options" onPress={() => setMenu(true)} style={styles.iconButton}>
            <MoreIcon color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={[styles.hero, { backgroundColor: log.mediaColor ?? niche.field }]}>
          {log.imageUri ? <Image source={{ uri: log.imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Photo: ${log.title}`} /> : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.kicker, { color: niche.ink, backgroundColor: niche.field }]}>
            {words.diary} · {dayLabel(log.date)}
          </Text>
          <DisplayText size={28}>{log.title}</DisplayText>
          <Stars rating={log.rating} size={22} color={niche.accent} />
          {log.notes ? <Text style={styles.notes}>{log.notes}</Text> : null}

          <View style={styles.metaRow}>
            <Avatar user={owner} size={28} />
            <Text style={styles.meta}>{isMine ? 'Your entry' : owner?.username}</Text>
            {isMine ? (
              <View style={styles.badge}>
                {log.visibility === 'private' ? <LockIcon size={12} color={colors.textSecondary} /> : null}
                <Text style={styles.badgeText}>{log.visibility === 'private' ? 'Just you' : 'On your profile'}</Text>
              </View>
            ) : null}
          </View>

          {source ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: source.id } })} style={styles.source}>
              <Text style={styles.sourceLabel}>Made from</Text>
              <Text style={styles.sourceText} numberOfLines={2}>
                {source.mediaLabel ?? source.caption} · {usersById[source.authorId]?.username}
              </Text>
            </Pressable>
          ) : null}

          {isMine ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              {log.sharedPostId ? (
                <Button tone="outline" label="See the post you shared" onPress={() => router.push({ pathname: '/post/[id]', params: { id: log.sharedPostId! } })} />
              ) : niche.open ? (
                <Button label={`Share as a post in ${niche.label}`} color={niche.accent} onPress={shareNow} />
              ) : null}
              <Button
                tone="outline"
                label={inTop ? `In your ${words.top}` : favs.length >= MAX_FAVORITES ? `Swap into your ${words.top}` : `Add to your ${words.top}`}
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
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 300, overflow: 'hidden' },
  body: { padding: 20, gap: 10 },
  kicker: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  notes: { fontSize: 16, lineHeight: 23, color: colors.textBody },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  meta: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: colors.surface },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  source: { padding: 12, borderRadius: 14, backgroundColor: colors.surface, gap: 2 },
  sourceLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  sourceText: { fontSize: 14, color: colors.text },
});
