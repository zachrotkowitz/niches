import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stars } from '@/components/diary';
import { CloseIcon } from '@/components/icons';
import { Text } from '@/components/text';
import { logPhoto } from '@/lib/demo-photos';
import type { LogEntry } from '@/lib/diary';
import { useAppGround } from '@/lib/store';
import { fonts, groundSurface, type Niche } from '@/lib/theme';

/**
 * "In your diary" (founder, Nov 24 2026): every entry you made from a post,
 * newest first, with its photo, name, date and stars. Tap one to open it;
 * Remove asks once more right in the row, so nothing goes by accident and
 * there's no timed Undo. Add again makes another entry.
 */
export function DiaryEntriesSheet({
  visible,
  entries,
  niche,
  onClose,
  onOpen,
  onRemove,
  onAddAgain,
}: {
  visible: boolean;
  entries: LogEntry[];
  niche: Niche;
  onClose: () => void;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onAddAgain: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ground = groundSurface(useAppGround());
  const [confirming, setConfirming] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) setConfirming(null);
  }, [visible]);
  const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* Nothing behind is dimmed (founder); tap above to close. */}
      <Pressable accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.card, { marginBottom: Math.max(insets.bottom, 14) + 10 }]}>
        <View style={styles.head}>
          <Text accessibilityRole="header" style={[styles.title, { color: ground.text }]}>
            In your <Text style={{ fontFamily: fonts.displayItalic }}>{niche.label}</Text> diary
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={6} style={styles.close}>
            <CloseIcon size={18} color={ground.text} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
          {entries.map((l, i) => (
            <View key={l.id} style={[styles.row, { backgroundColor: ground.ground }]}>
              {confirming === l.id ? (
                <View style={styles.confirm}>
                  <Text style={[styles.confirmText, { color: ground.text }]}>Remove this entry from your diary?</Text>
                  <View style={styles.confirmButtons}>
                    <Pressable accessibilityRole="button" onPress={() => setConfirming(null)} style={[styles.smallButton, { backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.smallButtonText, { color: ground.text }]}>Keep it</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => (onRemove(l.id), setConfirming(null))} style={[styles.smallButton, { backgroundColor: '#A3402B' }]}>
                      <Text style={[styles.smallButtonText, { color: '#FFFFFF' }]}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open entry: ${l.title}, ${day(l.date)}`} onPress={() => onOpen(l.id)} style={styles.open}>
                    <View style={[styles.thumb, { backgroundColor: l.mediaColor ?? niche.field }]}>
                      {logPhoto(l) ? <Image source={logPhoto(l)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <Text style={[styles.entryTitle, { color: ground.text }]} numberOfLines={1}>{l.title}</Text>
                      <View style={styles.meta}>
                        <Text style={[styles.metaText, { color: ground.muted }]}>{day(l.date)}{entries.length > 1 && i === 0 ? ' · newest' : ''}</Text>
                        {l.rating ? <Stars rating={l.rating} size={12} color={niche.accent} /> : null}
                      </View>
                    </View>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove entry from ${day(l.date)}`} onPress={() => setConfirming(l.id)} hitSlop={8}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </>
              )}
            </View>
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" onPress={onAddAgain} style={({ pressed }) => [styles.again, { backgroundColor: niche.ink, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.againText}>Add to diary again</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, padding: 16, gap: 12, borderRadius: 28, backgroundColor: '#FFFFFF', shadowColor: '#1F1A14', shadowOpacity: 0.22, shadowRadius: 25, shadowOffset: { width: 0, height: 18 }, elevation: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, flexShrink: 1 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(31,26,20,0.07)', alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 68, borderRadius: 16, padding: 8, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  entryTitle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12 },
  remove: { fontSize: 13, fontWeight: '700', color: '#A3402B', textDecorationLine: 'underline' },
  confirm: { flex: 1, gap: 8, paddingLeft: 6, paddingVertical: 4 },
  confirmText: { fontSize: 14, fontWeight: '600' },
  confirmButtons: { flexDirection: 'row', gap: 8 },
  smallButton: { flex: 1, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { fontSize: 14, fontWeight: '700' },
  again: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  againText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
