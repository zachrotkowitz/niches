import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, TOUCH } from '@/lib/theme';

export type SheetItem = {
  label: string;
  /** Short helper line under the label. */
  detail?: string;
  icon?: ReactNode;
  destructive?: boolean;
  onPress: () => void;
};

/** A bottom sheet, like iOS action sheets. Tap outside or "Cancel" to close. */
export function Sheet({ visible, onClose, title, items, children }: { visible: boolean; onClose: () => void; title?: string; items?: SheetItem[]; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.grabber} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView bounces={false} style={{ maxHeight: 520 }}>
            {children}
            {items?.map((item, i) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityHint={item.detail}
                onPress={item.onPress}
                style={({ pressed }) => [styles.item, i > 0 || children ? styles.itemDivider : null, pressed ? { backgroundColor: colors.surface } : null]}>
                {item.icon ? <View style={styles.icon}>{item.icon}</View> : null}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.label, item.destructive ? { color: colors.danger } : null]}>{item.label}</Text>
                  {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed ? { backgroundColor: '#E9EBE7' } : null]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // No dimming behind the sheet (founder feedback); a shadow separates it instead.
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  sheet: { backgroundColor: colors.ground, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.hairline, shadowColor: '#14161A', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 16, paddingHorizontal: 16, paddingTop: 8, gap: 4, width: '100%', maxWidth: 560, alignSelf: 'center' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D5D8D3', marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textAlign: 'center', paddingBottom: 6 },
  item: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 12 },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.hairline, borderRadius: 0 },
  icon: { width: 24, alignItems: 'center' },
  label: { fontSize: 16, color: colors.text, fontWeight: '500' },
  detail: { fontSize: 13, color: colors.textMuted, lineHeight: 17 },
  cancel: { minHeight: TOUCH + 4, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
