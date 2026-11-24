import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CloseIcon, PlusIcon } from '@/components/icons';
import { ReorderRow } from '@/components/reorder-row';
import { Text } from '@/components/text';

const THUMB = 62;
const GAP = 10;

/**
 * The row of photos under a post or a listing (founder, Nov 24 2026): each
 * numbered 1–10 in a small white circle, hold and drag to change the order
 * (like Instagram; the strip stops scrolling while you drag), × to remove, a
 * dashed + to add. Number 1 leads. Shared by the Post tab and Sell something.
 */
export function PhotoStrip({
  uris,
  max,
  selected,
  ink,
  line,
  onSelect,
  onReorder,
  onRemove,
  onAdd,
}: {
  uris: string[];
  max: number;
  /** The one showing big above, outlined. */
  selected?: number;
  ink: string;
  line: string;
  onSelect?: (i: number) => void;
  onReorder: (uris: string[]) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  if (!uris.length) return null;
  return (
    <ScrollView horizontal scrollEnabled={!dragging} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      <View style={{ width: uris.length * (THUMB + GAP) - GAP, height: THUMB + 30 }}>
        <ReorderRow
          slots={uris.length}
          gap={GAP}
          itemHeight={() => THUMB + 30}
          onDragChange={setDragging}
          onReorder={(keys) => keys.join('|') !== uris.join('|') && onReorder(keys)}
          items={uris.map((uri, i) => ({
            key: uri,
            label: `Photo ${i + 1}`,
            onPress: onSelect ? () => onSelect(i) : undefined,
            render: () => (
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.thumb, { borderColor: i === (selected ?? 0) ? ink : 'transparent' }]}>
                  <Image source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
                  {uris.length > 1 ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} onPress={() => onRemove(i)} hitSlop={6} style={styles.x}>
                      <CloseIcon size={10} strokeWidth={2.6} />
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.num}>
                  <Text style={[styles.numText, { color: ink }]}>{i + 1}</Text>
                </View>
              </View>
            ),
          }))}
        />
      </View>
      {uris.length < max ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Add another photo" onPress={onAdd} style={[styles.thumb, styles.add, { borderColor: line }]}>
          <PlusIcon size={20} color={ink} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: GAP, paddingHorizontal: 20, paddingTop: 12, alignItems: 'flex-start' },
  thumb: { width: THUMB, height: THUMB, borderRadius: 12, overflow: 'hidden', borderWidth: 2 },
  add: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  x: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  num: { marginTop: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
