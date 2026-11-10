import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';

export type TabItem = { key: string; label: string; accessibilityLabel?: string; /** Underline color when selected (a niche's color). Defaults to the text color. */ color?: string };

/**
 * "Quiet tabs" (founder's pick over pill chips, Nov 2026): plain words in a
 * row, the selected one bold with a line under it, a hairline under the row.
 * Used for Discover topics, search result types and the niche filters on Saved.
 */
export function UnderlineTabs({ items, value, onChange, label, inset = 12 }: { items: TabItem[]; value: string; onChange: (key: string) => void; label: string; inset?: number }) {
  const surface = useSurface();
  return (
    <View style={[styles.wrap, { borderBottomColor: surface.line }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={label} contentContainerStyle={{ paddingHorizontal: inset }}>
        {items.map((item) => {
          const on = item.key === value;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              onPress={() => onChange(item.key)}
              style={styles.tab}>
              <Text style={[styles.text, { color: on ? surface.text : surface.muted, fontWeight: on ? '700' : '500' }]} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={[styles.line, { backgroundColor: on ? (item.color ?? surface.text) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  tab: { minHeight: 46, paddingHorizontal: 10, justifyContent: 'flex-end' },
  text: { fontSize: 15, paddingBottom: 11 },
  line: { height: 2.5, borderRadius: 2, marginBottom: -1 },
});
