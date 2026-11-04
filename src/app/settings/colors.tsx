import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { useNiches, useStore } from '@/lib/store';
import { colors, DEFAULT_PALETTE, NICHE_ORDER, PALETTES, PALETTES_BY_ID, TOUCH, type NicheId } from '@/lib/theme';

/**
 * Color lab: try a different palette for each niche and see the whole app
 * change. Choices are saved on this device only.
 */
export default function ColorLabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const changed = Object.keys(state.palettes).length > 0;

  const usedBy = (paletteId: string, except: NicheId) =>
    NICHE_ORDER.filter((id) => id !== except && niches[id].paletteId === paletteId).map((id) => niches[id].label);

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + 4 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to profile" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} style={styles.back}>
          <ChevronLeftIcon color={colors.text} />
          <Text style={styles.backText}>Profile</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.head}>
          <DisplayText size={34}>Color lab</DisplayText>
          <Text style={styles.sub}>Pick a palette for each niche. The whole app updates as you tap. Every palette here is checked to stay readable.</Text>
        </View>

        {NICHE_ORDER.map((id) => {
          const n = niches[id];
          return (
            <View key={id} style={styles.block}>
              <View style={[styles.preview, { backgroundColor: n.field }]}>
                <DisplayText size={28} color={n.ink}>{n.label}</DisplayText>
                <Text style={[styles.previewSub, { color: n.inkSoft }]}>{PALETTES_BY_ID[n.paletteId]?.name}{n.paletteId === DEFAULT_PALETTE[id] ? ' · original' : ''}</Text>
                <View style={styles.previewRow}>
                  <View style={[styles.previewChip, { backgroundColor: n.accent }]}>
                    <Text style={styles.previewChipText}>{n.label}</Text>
                  </View>
                  <View style={[styles.previewTile, { borderColor: n.accent }]} accessibilityLabel={`${n.label} border sample`} />
                  <Text style={[styles.previewLink, { color: n.accent }]}>Saved</Text>
                </View>
              </View>

              <View accessibilityRole="radiogroup" accessibilityLabel={`${n.label} palette`} style={styles.swatches}>
                {PALETTES.map((p) => {
                  const selected = p.id === n.paletteId;
                  const shared = usedBy(p.id, id);
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${p.name}${shared.length ? `, also used by ${shared.join(' and ')}` : ''}`}
                      onPress={() => actions.setPalette(id, p.id === DEFAULT_PALETTE[id] ? null : p.id)}
                      style={({ pressed }) => [styles.swatchWrap, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
                      <View style={[styles.swatch, { backgroundColor: p.accent, borderColor: selected ? colors.text : 'transparent' }]}>
                        <View style={[styles.swatchField, { backgroundColor: p.field }]} />
                        {selected ? <CheckIcon size={16} strokeWidth={3} /> : null}
                      </View>
                      <Text style={[styles.swatchName, selected ? { color: colors.text, fontWeight: '700' } : null]} numberOfLines={1}>{p.name}</Text>
                      {shared.length ? <Text style={styles.shared} numberOfLines={1}>{shared[0]}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ paddingHorizontal: 20, gap: 10, marginTop: 8 }}>
          <Text style={styles.note}>Tip: niches that sit side by side on Discover and Saved are easiest to tell apart when their colors differ in lightness too, not just hue. Names under a swatch show which other niche already uses it.</Text>
          <Button
            tone="outline"
            label="Reset to original colors"
            disabled={!changed}
            onPress={() => {
              NICHE_ORDER.forEach((id) => actions.setPalette(id, null));
              toast('Original colors restored');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  nav: { paddingHorizontal: 6, paddingBottom: 4 },
  back: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingRight: 12 },
  backText: { fontSize: 17, color: colors.text },
  head: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  sub: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  block: { marginTop: 22, gap: 12 },
  preview: { marginHorizontal: 20, borderRadius: 22, padding: 18, gap: 6 },
  previewSub: { fontSize: 13, fontWeight: '600' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  previewChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center' },
  previewChipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  previewTile: { width: 40, height: 40, borderRadius: 10, borderWidth: 3, backgroundColor: '#FFFFFF' },
  previewLink: { fontSize: 15, fontWeight: '700' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, rowGap: 10 },
  swatchWrap: { width: '25%', alignItems: 'center', gap: 4, paddingVertical: 4 },
  swatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  swatchField: { position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderTopLeftRadius: 10 },
  swatchName: { fontSize: 12, color: colors.textMuted },
  shared: { fontSize: 10, color: colors.textMuted, fontStyle: 'italic' },
  note: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
