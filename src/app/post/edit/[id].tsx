import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridTile } from '@/components/feed-grid';
import { Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { shortTitle } from '@/lib/format';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';
import type { PreviewShape } from '@/lib/types';

type ShapeChoice = PreviewShape | 'auto';

const SHAPES: { id: ShapeChoice; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'tall', label: 'Tall' },
  { id: 'square', label: 'Square' },
  { id: 'short', label: 'Short' },
];

/** Edit a post's text, and adjust how it previews in grids. */
export default function EditPostScreen() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const post = state.posts.find((p) => p.id === id);

  const [caption, setCaption] = useState(post?.caption ?? '');
  const [progress, setProgress] = useState(post?.progressLabel ?? '');
  const [shape, setShape] = useState<ShapeChoice>(post?.previewShape ?? 'auto');
  const [title, setTitle] = useState(post?.previewTitle ?? '');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!post || !state.me || post.authorId !== state.me.id) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 16 }]}>
        <Text style={{ fontSize: 17, color: colors.text }}>You can only edit your own posts.</Text>
        <Button label="Go back" onPress={close} />
      </View>
    );
  }

  const niche = niches[post.niche];
  const previewOnly = section === 'preview';
  const ready = caption.trim().length > 0;
  const draft = { ...post, caption: caption.trim() || post.caption, previewShape: shape === 'auto' ? undefined : shape, previewTitle: title.trim() || undefined };

  const save = () => {
    if (!ready) return;
    const textChanged = caption.trim() !== post.caption || (post.progressLabel ?? '') !== progress.trim();
    actions.updatePost(post.id, {
      caption: caption.trim(),
      // The short title shown on grids and in Top 4 follows the caption you just edited.
      ...(caption.trim() !== post.caption && post.kind !== 'text' ? { mediaLabel: shortTitle(caption.trim()) } : null),
      progressLabel: post.progressLabel !== undefined ? progress.trim() || undefined : undefined,
      previewShape: draft.previewShape,
      previewTitle: draft.previewTitle,
      ...(textChanged ? { editedAt: Date.now() } : null),
    });
    toast(previewOnly ? 'Preview updated' : 'Post updated');
    close();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={close} style={styles.navButton}>
          <Text style={[styles.navText, { color: niche.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>{previewOnly ? 'Adjust preview' : 'Edit post'}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={save} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: niche.accent, fontWeight: '700', opacity: ready ? 1 : 0.4 }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        {previewOnly ? null : (
          <>
            {post.progressLabel !== undefined ? (
              <Field label="Progress label">
                <TextInput accessibilityLabel="Progress label" value={progress} onChangeText={setProgress} maxLength={60} style={styles.input} selectionColor={niche.accent} />
              </Field>
            ) : null}
            <Field label="Caption">
              <TextInput accessibilityLabel="Caption" value={caption} onChangeText={setCaption} multiline maxLength={2000} style={[styles.input, styles.textarea]} selectionColor={niche.accent} />
            </Field>
          </>
        )}

        <View style={{ gap: 12 }}>
          <Text style={styles.section}>{previewOnly ? 'How it looks in grids' : 'Grid preview'}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tile shape" style={styles.segment}>
            {SHAPES.map((s) => {
              const selected = s.id === shape;
              return (
                <Pressable key={s.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setShape(s.id)} style={[styles.segmentOption, selected ? styles.segmentSelected : null]}>
                  <Text style={[styles.segmentText, { color: selected ? colors.text : colors.textMuted }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Field label="Title under the tile">
            <TextInput
              accessibilityLabel="Title under the tile"
              value={title}
              onChangeText={setTitle}
              placeholder={post.mediaLabel || post.caption.slice(0, 40)}
              placeholderTextColor="#6B7178"
              maxLength={40}
              style={styles.input}
              selectionColor={niche.accent}
            />
          </Field>
          <View style={styles.previewWrap} accessibilityLabel="Preview">
            <View style={{ width: 172 }}>
              <GridTile post={draft} interactive={false} />
            </View>
            <Text style={styles.previewNote}>This is how your post appears in the {niche.label} grid, Saved and Discover. The full post doesn’t change.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline, backgroundColor: 'transparent' },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  section: { fontSize: 17, fontWeight: '700', color: colors.text },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F0F1EE' },
  segmentOption: { flex: 1, minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: '#FFFFFF', shadowColor: '#14161A', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  previewWrap: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', padding: 14, borderRadius: 18, backgroundColor: colors.surface },
  previewNote: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
