import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { DiaryEntriesSheet } from '@/components/diary-entries-sheet';
import { CheckIcon } from '@/components/icons';
import { QuickLog } from '@/components/quick-log';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { diaryWords } from '@/lib/diary';
import { useNiches, useStore } from '@/lib/store';
import { TOUCH } from '@/lib/theme';
import type { Post } from '@/lib/types';

/**
 * "+ Want to make" and "Add to diary" side by side, in the niche's dark color
 * with white words (founder, Nov 24 2026). On every post, yours too. Once a
 * post is in your diary, "✓ Added to diary" opens your entries from it.
 * Used under posts in the feed (new look, Nov 26 2026) and on the post page.
 */
export function DiaryButtons({ post, style, guard }: { post: Post; style?: StyleProp<ViewStyle>; guard?: () => boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const { state, actions } = useStore();
  const niche = useNiches()[post.niche];
  const [logging, setLogging] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const myLogs = state.logs.filter((l) => l.postId === post.id && l.userId === state.me?.id).sort((a, b) => b.createdAt - a.createdAt);
  const wanted = !!state.wantList[post.id];
  // A tap that ends a swipe between niches shouldn't press a button.
  const ok = () => !guard || !guard();

  return (
    <>
      <View style={[styles.row, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: wanted }}
          onPress={() => ok() && actions.toggleWant(post.id)}
          style={({ pressed }) => [styles.button, { backgroundColor: niche.ink, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <Text style={styles.text} numberOfLines={1}>{wanted ? '✓ On your list' : `+ ${diaryWords(post.niche).want}`}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={myLogs.length ? `Added to diary${myLogs.length > 1 ? `, ${myLogs.length} times` : ''}. See your entries` : 'Add to diary'}
          onPress={() => ok() && (myLogs.length ? setShowEntries(true) : setLogging(true))}
          style={({ pressed }) => [styles.button, styles.withIcon, { backgroundColor: niche.ink, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          {myLogs.length ? <CheckIcon size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
          <Text style={styles.text} numberOfLines={1}>{myLogs.length ? 'Added to diary' : 'Add to diary'}</Text>
        </Pressable>
      </View>
      {/* Mounted only while open, so a long feed doesn't carry a sheet per post. */}
      {logging ? <QuickLog post={post} visible onClose={() => setLogging(false)} /> : null}
      {showEntries ? (
        <DiaryEntriesSheet
          visible
          entries={myLogs}
          niche={niche}
          onClose={() => setShowEntries(false)}
          onOpen={(id) => (setShowEntries(false), router.push({ pathname: '/log/[id]', params: { id } }))}
          onRemove={(id) => {
            actions.deleteLog(id);
            showToast('Removed from your diary', undefined, niche.ink);
            if (myLogs.length <= 1) setShowEntries(false);
          }}
          onAddAgain={() => (setShowEntries(false), setLogging(true))}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: TOUCH, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  withIcon: { flexDirection: 'row', gap: 6 },
  text: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
