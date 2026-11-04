import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet, type SheetItem } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';
import type { Post, ReportReason } from '@/lib/types';

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Bullying or harassment' },
  { id: 'harmful', label: 'Harmful content, like eating-disorder promotion' },
  { id: 'stolen', label: 'Stolen work or AI art posted as their own' },
  { id: 'other', label: 'Something else' },
];

type Step = 'menu' | 'confirmDelete' | 'report';

/** The post's "⋯" menu. Authors get Instagram-style controls; everyone else gets save, hide and report. */
/** `onGone` runs when the post disappears for this viewer (deleted, hidden or reported), e.g. to leave the post screen. */
export function PostMenu({ post, visible, onClose, onGone }: { post: Post; visible: boolean; onClose: () => void; onGone?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { state, actions, usersById } = useStore();
  const [step, setStep] = useState<Step>('menu');
  const isMine = !!state.me && post.authorId === state.me.id;
  const saved = !!state.saves[post.id];

  const close = () => {
    setStep('menu');
    onClose();
  };
  const run = (fn: () => void, message?: string) => () => {
    close();
    fn();
    if (message) toast(message);
  };

  if (step === 'confirmDelete') {
    return (
      <Sheet visible={visible} onClose={close} title="Delete this post?">
        <Text style={styles.body}>It will be gone for good, along with its comments. To hide it without losing it, archive it instead.</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => setStep('menu')} style={[styles.choice, { backgroundColor: colors.surface }]}>
            <Text style={styles.choiceText}>Keep it</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              close();
              actions.deletePost(post.id);
              toast('Post deleted');
              onGone?.();
            }}
            style={[styles.choice, { backgroundColor: colors.danger }]}>
            <Text style={[styles.choiceText, { color: '#FFFFFF' }]}>Delete</Text>
          </Pressable>
        </View>
      </Sheet>
    );
  }

  if (step === 'report') {
    return (
      <Sheet
        visible={visible}
        onClose={close}
        title="Why are you reporting this post?"
        items={REASONS.map((r) => ({
          label: r.label,
          onPress: run(() => {
            actions.report(post.id, r.id);
            onGone?.();
          }, 'Thanks. We hid this post and will review it.'),
        }))}>
        <Text style={styles.body}>Your report is anonymous. {usersById[post.authorId]?.username ?? 'They'} won’t know who sent it.</Text>
      </Sheet>
    );
  }

  const items: SheetItem[] = isMine
    ? [
        { label: 'Edit', detail: 'Change the caption or progress label.', onPress: run(() => router.push({ pathname: '/post/edit/[id]', params: { id: post.id } })) },
        { label: 'Adjust preview', detail: 'Choose how this post looks in grids.', onPress: run(() => router.push({ pathname: '/post/edit/[id]', params: { id: post.id, section: 'preview' } })) },
        {
          label: post.hideCheers ? 'Show cheer count to me' : 'Hide cheer count',
          detail: post.hideCheers ? 'See how many people cheered.' : 'Nobody else ever sees it. This hides it from you too.',
          onPress: run(() => actions.updatePost(post.id, { hideCheers: !post.hideCheers }), post.hideCheers ? 'Cheer count shown to you' : 'Cheer count hidden'),
        },
        {
          label: post.commentsOff ? 'Turn on commenting' : 'Turn off commenting',
          detail: post.commentsOff ? 'People can comment again.' : 'Hides comments and stops new ones.',
          onPress: run(() => actions.updatePost(post.id, { commentsOff: !post.commentsOff }), post.commentsOff ? 'Comments turned on' : 'Comments turned off'),
        },
        {
          label: post.archived ? 'Show on profile' : 'Archive',
          detail: post.archived ? 'Put it back in feeds and on your profile.' : 'Hide it from feeds and your profile. Only you can find it, in Profile.',
          onPress: run(() => actions.updatePost(post.id, { archived: !post.archived }), post.archived ? 'Post restored' : 'Post archived'),
        },
        { label: 'Delete', destructive: true, onPress: () => setStep('confirmDelete') },
      ]
    : [
        { label: saved ? 'Remove from saved' : 'Save', onPress: run(() => actions.toggleSave(post.id), saved ? 'Removed from saved' : 'Saved') },
        { label: 'Not interested', detail: 'Hide this post from your feeds.', onPress: run(() => {
          actions.toggleHidden(post.id);
          onGone?.();
        }, 'Got it. This post is hidden.') },
        { label: `About ${usersById[post.authorId]?.username ?? 'this account'}`, onPress: run(() => router.push({ pathname: '/user/[id]', params: { id: post.authorId } })) },
        { label: 'Copy link', onPress: run(() => void Clipboard.setStringAsync(`niches://post/${post.id}`), 'Link copied') },
        { label: 'Report', destructive: true, onPress: () => setStep('report') },
      ];

  return <Sheet visible={visible} onClose={close} items={items} />;
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, paddingHorizontal: 8, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  choice: { flex: 1, minHeight: TOUCH + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
