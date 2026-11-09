import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { useNiches, useStore } from '@/lib/store';
import { APP_GROUNDS, colors, DEFAULT_PALETTE, distinctness, NICHE_ORDER, PALETTES, PALETTES_BY_ID, SCHEMES, TOUCH, type NicheId, type Scheme } from '@/lib/theme';

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

  const [showBasics, setShowBasics] = useState(false);
  const activeScheme = SCHEMES.find((sc) => NICHE_ORDER.every((id) => sc.palettes[id] === niches[id].paletteId));
  const tellApart = distinctness(NICHE_ORDER.map((id) => niches[id].accent));

  const applyScheme = (sc: Scheme) => {
    NICHE_ORDER.forEach((id) => actions.setPalette(id, sc.palettes[id] === DEFAULT_PALETTE[id] ? null : sc.palettes[id]));
    toast(`${sc.name} applied`);
  };

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
          <Text style={styles.sub}>Start from a color scheme, then fine-tune any niche below. The whole app updates as you tap, and every palette is checked to stay readable.</Text>
          <View style={styles.meter} accessibilityLabel={`Your current colors: ${tellApart.label}`}>
            <View style={styles.meterDots}>
              {NICHE_ORDER.map((id) => (
                <View key={id} style={[styles.meterDot, { backgroundColor: niches[id].accent }]} />
              ))}
            </View>
            <Text style={styles.meterText}>{activeScheme ? `${activeScheme.name} · ` : 'Custom · '}{tellApart.label}</Text>
          </View>
        </View>

        <Text style={styles.section}>App background</Text>
        <Text style={styles.groundSub}>For everything that isn’t a niche feed: Profile, Discover, Saved, Post and Plans. Niche feeds keep their own colors.</Text>
        <View style={styles.grounds} accessibilityRole="radiogroup">
          {APP_GROUNDS.map((g) => {
            const on = g.id === state.appGround;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  actions.setAppGround(g.id);
                  toast(`${g.name} background`);
                }}
                style={[styles.groundOption, { backgroundColor: g.ground, borderColor: on ? g.text : g.line }]}>
                <Text style={[styles.groundName, { color: g.text }]}>{g.name}</Text>
                <Text style={[styles.groundNote, { color: g.muted }]}>{on ? 'In use' : 'Tap to try'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Color schemes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schemes}>
          {SCHEMES.map((sc) => {
            const on = activeScheme?.id === sc.id;
            const rating = distinctness(NICHE_ORDER.map((id) => PALETTES_BY_ID[sc.palettes[id]].accent));
            return (
              <Pressable
                key={sc.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityHint={sc.why}
                onPress={() => applyScheme(sc)}
                style={({ pressed }) => [styles.scheme, on ? styles.schemeOn : null, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View style={styles.schemeStrip}>
                  {NICHE_ORDER.map((id) => {
                    const p = PALETTES_BY_ID[sc.palettes[id]];
                    return (
                      <View key={id} style={[styles.schemeBand, { backgroundColor: p.field }]}>
                        <View style={[styles.schemeDot, { backgroundColor: p.accent }]} />
                        <Text style={[styles.schemeNiche, { color: p.ink }]} numberOfLines={1}>{niches[id].label}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={{ gap: 4, padding: 14, paddingTop: 12 }}>
                  <Text style={styles.schemeName}>{sc.name}{on ? ' · in use' : ''}</Text>
                  <Text style={styles.schemeTheory}>{sc.theory}</Text>
                  <Text style={styles.schemeWhy}>{sc.why}</Text>
                  <Text style={styles.schemeRating}>{rating.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showBasics }} onPress={() => setShowBasics((v) => !v)} style={styles.basicsToggle}>
          <Text style={styles.basicsTitle}>Color theory in a minute</Text>
          <Text style={styles.basicsAction}>{showBasics ? 'Hide' : 'Show'}</Text>
        </Pressable>
        {showBasics ? (
          <View style={styles.basics}>
            <Basic title="The color wheel" body="Picture the rainbow bent into a circle: red, orange, yellow, green, blue, purple, and back to red. Every scheme is just a way of picking spots on that circle." />
            <Basic title="Opposites pop" body="Colors across the circle from each other (green and red, blue and orange) are called complementary. Side by side they look lively and are easy to tell apart." />
            <Basic title="Neighbors calm" body="Colors next to each other (blue, teal, green) are called analogous. They feel calm and unified, but they blur together more easily." />
            <Basic title="Evenly spaced is balanced" body="Three or four colors spread evenly around the circle (a triad or a rectangle) give each one equal weight. That’s good for Niches, where no niche should look more important." />
            <Basic title="Light and dark matter too" body="About 1 in 12 men have trouble telling some hues apart, especially red from green. Colors that also differ in lightness stay distinct for everyone. The rating on each scheme checks this." />
            <Basic title="Meaning" body="People link colors with feelings: warm reds and oranges with food and appetite, blues with calm and creativity, greens with health and growth. A color that fits its niche makes the app feel intentional." />
          </View>
        ) : null}

        <Text style={[styles.section, { marginTop: 28 }]}>Fine-tune each niche</Text>

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

function Basic({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.basicTitle}>{title}</Text>
      <Text style={styles.basicBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  groundSub: { fontSize: 14, lineHeight: 20, color: colors.textMuted, paddingHorizontal: 20, marginTop: 4 },
  grounds: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  groundOption: { flex: 1, minHeight: 76, borderRadius: 16, borderWidth: 2, padding: 12, justifyContent: 'space-between' },
  groundName: { fontSize: 16, fontWeight: '700' },
  groundNote: { fontSize: 12, fontWeight: '600' },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface },
  meterDots: { flexDirection: 'row', gap: 4 },
  meterDot: { width: 14, height: 14, borderRadius: 7 },
  meterText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  section: { fontSize: 19, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 18 },
  schemes: { gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  scheme: { width: 260, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  schemeOn: { borderWidth: 2.5, borderColor: colors.text },
  schemeStrip: { flexDirection: 'row' },
  schemeBand: { flex: 1, height: 74, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 2 },
  schemeDot: { width: 24, height: 24, borderRadius: 12 },
  schemeNiche: { fontSize: 10, fontWeight: '700' },
  schemeName: { fontSize: 16, fontWeight: '700', color: colors.text },
  schemeTheory: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  schemeWhy: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  schemeRating: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  basicsToggle: { marginHorizontal: 20, marginTop: 18, minHeight: TOUCH + 4, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  basicsTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  basicsAction: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  basics: { marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: 14, backgroundColor: colors.surface, gap: 14 },
  basicTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  basicBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  screen: { flex: 1, backgroundColor: 'transparent' },
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
