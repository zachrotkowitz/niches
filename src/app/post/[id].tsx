import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, LockIcon } from '@/components/icons';
import { PostCard } from '@/components/post-card';
import { Avatar, Button } from '@/components/primitives';
import { timeAgo } from '@/lib/format';
import { postStats, useNiches, useStore } from '@/lib/store';
import { colors, fonts, TOUCH } from '@/lib/theme';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [draft, setDraft] = useState('');

  const post = state.posts.find((p) => p.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!post) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, padding: 20, gap: 16 }]}>
        <Text style={{ fontSize: 17 }}>This post isn’t available anymore.</Text>
        <Button label="Back to the feed" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const niche = niches[post.niche];
  const isMine = !!state.me && post.authorId === state.me.id;
  const stats = postStats(state, post);
  const comments = state.comments.filter((c) => c.postId === post.id).sort((a, b) => a.createdAt - b.createdAt);
  const canSend = draft.trim().length > 0 && !!state.me && !post.commentsOff;

  const send = () => {
    if (!canSend || !state.me) return;
    actions.addComment(post.id, state.me.id, draft.trim());
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${niche.label}`} onPress={goBack} style={styles.back}>
          <ChevronLeftIcon color={niche.accent} />
          <Text style={[styles.backText, { color: niche.accent }]}>{niche.label}</Text>
        </Pressable>
        <Text style={styles.navTitle}>{isMine ? 'Your post' : 'Post'}</Text>
        <View style={{ width: 96 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
        {post.archived ? (
          <View style={[styles.banner, { backgroundColor: niche.field }]}>
            <Text style={[styles.bannerText, { color: niche.ink }]}>Archived. Only you can see this post.</Text>
          </View>
        ) : null}
        <PostCard post={post} inDetail mediaHeight={320} onGone={goBack} />

        {isMine ? (
          <View style={styles.private} accessibilityLabel="Only you can see these numbers">
            <View style={styles.privateHead}>
              <LockIcon />
              <Text style={styles.privateTitle}>Only you can see these numbers</Text>
            </View>
            <View style={styles.statRow}>
              <Stat value={post.hideCheers ? null : stats.cheers} label="cheers" />
              <Stat value={stats.saves} label="saved it" />
              <Stat value={stats.comments} label="comments" />
            </View>
            <Text style={styles.privateNote}>Everyone else just sees your post. No public like counts, ever.</Text>
          </View>
        ) : null}

        <View style={styles.comments}>
          <Text style={styles.commentsTitle}>{post.commentsOff ? 'Comments are turned off' : comments.length === 0 ? 'No comments yet' : 'Comments'}</Text>
          {(post.commentsOff ? [] : comments).map((c) => {
            const author = usersById[c.authorId];
            return (
              <View key={c.id} style={styles.comment}>
                <Avatar user={author} size={30} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.commentMeta}>
                    <Text style={{ fontWeight: '600', color: colors.text }}>{author?.username ?? 'unknown'}</Text> · {timeAgo(c.createdAt)}
                  </Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {post.commentsOff ? null : (
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor="#6B7178"
          accessibilityLabel="Add a comment"
          onSubmitEditing={send}
          returnKeyType="send"
          maxLength={500}
          style={styles.input}
          selectionColor={niche.accent}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={send}
          style={[styles.send, { backgroundColor: niche.accent, opacity: canSend ? 1 : 0.45 }]}>
          <Text style={styles.sendText}>Post</Text>
        </Pressable>
      </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Stat({ value, label }: { value: number | null; label: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={value === null ? `${label} hidden` : `${value} ${label}`}>
      <Text style={[styles.statValue, value === null ? styles.statHidden : null]}>{value === null ? 'Hidden' : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  back: { minHeight: TOUCH, minWidth: 96, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  backText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  private: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: colors.surface, gap: 12 },
  privateHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privateTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, gap: 2 },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.text, fontVariant: ['tabular-nums'] },
  statHidden: { fontSize: 17, lineHeight: 30, color: colors.textMuted },
  statLabel: { fontSize: 12, color: colors.textMuted },
  banner: { marginHorizontal: 20, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  bannerText: { fontSize: 14, fontWeight: '600' },
  privateNote: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  comments: { paddingHorizontal: 20, paddingTop: 18, gap: 16 },
  commentsTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  comment: { flexDirection: 'row', gap: 10 },
  commentMeta: { fontSize: 13, color: colors.textMuted },
  commentText: { fontSize: 14, lineHeight: 20, color: colors.textBody },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.ground },
  input: { flex: 1, minHeight: TOUCH, borderRadius: 22, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  send: { minHeight: TOUCH, paddingHorizontal: 16, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
