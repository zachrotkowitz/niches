import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, CalendarIcon, GridLayoutIcon, PostsLayoutIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { useNiches, useStore, type FeedLayout } from '@/lib/store';
import { colors, fonts, NICHE_ORDER, TOUCH } from '@/lib/theme';

/** The tinted header: wordmark, niche title, layout switch and niche chips. */
export function NicheHeader({ position }: { position: SharedValue<number> }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const niche = NICHES[state.niche];
  const { width } = useWindowDimensions();
  const fields = NICHE_ORDER.map((id) => NICHES[id].field);
  const stops = NICHE_ORDER.map((_, i) => i);
  // Blend between niche colors as the pages slide under your finger.
  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(-position.get() / width, stops, fields) }));

  return (
    <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, bg]}>
      <View style={styles.topRow}>
        <Text style={[styles.wordmark, { color: niche.ink }]}>niches</Text>
        <View style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Plans" onPress={() => router.push('/plans')} style={styles.iconButton}>
            <CalendarIcon color={niche.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Notification digest" style={styles.iconButton}>
            <BellIcon color={niche.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.titleRow}>
        <DisplayText color={niche.ink}>{niche.label}</DisplayText>
        {niche.open ? <LayoutSwitch value={state.layout} onChange={actions.setLayout} ink={niche.ink} inkSoft={niche.inkSoft} /> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="tablist" accessibilityLabel="Niches">
        {NICHE_ORDER.map((id) => {
          const n = NICHES[id];
          const selected = id === state.niche;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={n.open ? n.label : `${n.label}, coming soon`}
              onPress={() => actions.setNiche(id)}
              style={({ pressed }) => [
                styles.chip,
                selected ? { backgroundColor: n.accent, borderColor: n.accent } : { backgroundColor: '#FFFFFF', borderColor: colors.border },
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}>
              <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.textBody }]}>{n.label}</Text>
              {!n.open ? <Text style={[styles.soon, { color: selected ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>soon</Text> : null}
            </Pressable>
          );
        })}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/discover')} style={[styles.chip, styles.requestChip]}>
          <Text style={[styles.chipText, { color: '#4A514C', fontWeight: '500' }]}>+ Request a niche</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

function LayoutSwitch({ value, onChange, ink, inkSoft }: { value: FeedLayout; onChange: (v: FeedLayout) => void; ink: string; inkSoft: string }) {
  const options: { id: FeedLayout; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'grid', label: 'Grid' },
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Feed layout" style={[styles.switch, { backgroundColor: `${ink}1A` }]}>
      {options.map((o) => {
        const selected = o.id === value;
        const Icon = o.id === 'posts' ? PostsLayoutIcon : GridLayoutIcon;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.id)}
            style={[styles.switchOption, selected ? styles.switchSelected : null]}>
            <Icon color={selected ? ink : inkSoft} />
            <Text style={[styles.switchText, { color: selected ? ink : inkSoft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 10 },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 17, letterSpacing: -0.4 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 2 },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 14, fontWeight: '600' },
  soon: { fontSize: 11, fontWeight: '600' },
  requestChip: { borderStyle: 'dashed', borderColor: '#9AA19B', backgroundColor: 'transparent' },
  switch: { flexDirection: 'row', padding: 3, borderRadius: 12, marginBottom: 2 },
  switchOption: { height: 34, paddingHorizontal: 11, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchSelected: { backgroundColor: '#FFFFFF', shadowColor: '#123F2A', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  switchText: { fontSize: 13, fontWeight: '600' },
});
