import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useNiches } from '@/lib/store';
import { colors, NICHE_ORDER, type NicheId } from '@/lib/theme';

/**
 * Multi-select niche chips for mixed-niche screens (Discover, Saved).
 * Each chip carries its niche's color, so the chips double as the legend for
 * the colored borders on the posts below. Empty selection means "All".
 */
export function NicheFilter({ value, onChange, available = NICHE_ORDER }: { value: NicheId[]; onChange: (next: NicheId[]) => void; available?: NicheId[] }) {
  const niches = useNiches();
  const all = value.length === 0;
  const toggle = (id: NicheId) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next.length === available.length ? [] : next);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel="Filter by niche">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: all }}
        onPress={() => onChange([])}
        style={[styles.chip, all ? { backgroundColor: colors.text, borderColor: colors.text } : { borderColor: colors.border }]}>
        <Text style={[styles.text, { color: all ? '#FFFFFF' : colors.textBody }]}>All</Text>
      </Pressable>
      {available.map((id) => {
        const n = niches[id];
        const on = value.includes(id);
        return (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={n.label}
            onPress={() => toggle(id)}
            style={({ pressed }) => [styles.chip, on ? { backgroundColor: n.accent, borderColor: n.accent } : { borderColor: colors.border }, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
            <View style={[styles.swatch, { borderColor: on ? '#FFFFFF' : n.accent }]} />
            <Text style={[styles.text, { color: on ? '#FFFFFF' : colors.textBody }]}>{n.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 20, paddingVertical: 4 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  // A tiny outlined square echoes the post borders this chip stands for.
  swatch: { width: 12, height: 12, borderRadius: 3, borderWidth: 2.5 },
  text: { fontSize: 14, fontWeight: '600' },
});
