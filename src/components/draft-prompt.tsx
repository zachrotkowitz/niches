import { Image, type ImageProps } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { useAppGround } from '@/lib/store';
import { fonts, groundSurface } from '@/lib/theme';

/**
 * "Save … as a draft?" (founder picked option A, Nov 24 2026; canvas page
 * "Shop", row "'Save as draft?' · three looks"): a white card floating above
 * the bottom, the photo across its top with a small tag, the question naming
 * the thing in the serif, Keep editing and Save draft side by side, and a red
 * Delete link. Nothing behind is dimmed; a tap above keeps editing. Used by
 * Sell something and the Post tab.
 */
export function DraftPrompt({
  visible,
  saved,
  title,
  photo,
  tag,
  tint,
  ink,
  onKeep,
  onSave,
  onDelete,
}: {
  visible: boolean;
  /** Reopened from a saved draft: "Keep … as a draft?" and "Delete the draft". */
  saved: boolean;
  title: string;
  photo?: ImageProps['source'];
  tag: string;
  /** Fills the photo area when there's no photo (the niche's mid tone). */
  tint: string;
  ink: string;
  onKeep: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ground = groundSurface(useAppGround());
  const name = title.trim();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onKeep} statusBarTranslucent>
      <Pressable accessibilityRole="button" accessibilityLabel="Keep editing" style={{ flex: 1 }} onPress={onKeep} />
      <View accessibilityViewIsModal style={[styles.card, { marginBottom: Math.max(insets.bottom, 14) + 10 }]}>
        <View style={[styles.photo, { backgroundColor: tint }]}>
          {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} /> : <CameraIcon size={30} color={ink} />}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text accessibilityRole="header" style={[styles.title, { color: ground.text }]}>
            {saved ? 'Keep ' : 'Save '}
            {name ? <Text style={{ fontFamily: fonts.displayItalic }}>{name}</Text> : 'this'}
            {' as a draft?'}
          </Text>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" onPress={onKeep} style={({ pressed }) => [styles.button, { backgroundColor: ground.ground, opacity: pressed ? 0.75 : 1 }]}>
              <Text style={[styles.buttonText, { color: ground.text }]}>Keep editing</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSave} style={({ pressed }) => [styles.button, { backgroundColor: ground.text, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.buttonText, { color: ground.ground }]}>Save draft</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={8} style={styles.deleteHit}>
            <Text style={styles.deleteText}>{saved ? 'Delete the draft' : 'Delete it'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, borderRadius: 28, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#1F1A14', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 18 }, elevation: 18 },
  photo: { height: 150, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', left: 14, bottom: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  tagText: { fontSize: 12, fontWeight: '700', color: '#1F1A14' },
  body: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 33 },
  buttons: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  deleteHit: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#A3402B', textDecorationLine: 'underline' },
});
