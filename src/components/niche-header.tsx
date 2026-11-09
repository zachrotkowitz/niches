import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, CalendarIcon, GridLayoutIcon, PostsLayoutIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { Text } from '@/components/text';
import { SHOP_NICHES } from '@/lib/shop';
import { useNiches, useStore, type FeedLayout } from '@/lib/store';
import { fonts, NICHE_ORDER, TOUCH } from '@/lib/theme';

/**
 * The top of Home in the "Soft Flood" look: the niche's mid-tone fills it,
 * the niche name is set big in italic serif, and the color blends between
 * niches as the pages slide under your finger.
 */
export function NicheHeader({ position }: { position: SharedValue<number> }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const niche = NICHES[state.niche];
  const { width } = useWindowDimensions();
  const mids = NICHE_ORDER.map((id) => NICHES[id].mid);
  const stops = NICHE_ORDER.map((_, i) => i);
  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(-position.get() / width, stops, mids) }));
  // Long names ("Photography") shrink to fit on one line.
  const titleSize = Math.min(64, Math.floor((Math.min(width, 640) - 40) / (niche.label.length * 0.46)));
  const showLayout = niche.open && !(state.homeMode === 'shop' && SHOP_NICHES.includes(niche.id));

  return (
    <Animated.View style={[styles.header, { paddingTop: insets.top + 6 }, bg]}>
      <View style={styles.topRow}>
        <Text style={[styles.wordmark, { color: niche.ink }]}>niches</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {showLayout ? <LayoutSwitch value={state.layout} onChange={actions.setLayout} ink={niche.ink} inkSoft={niche.inkSoft} /> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Plans" onPress={() => router.push('/plans')} style={styles.iconButton}>
            <CalendarIcon color={niche.ink} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Notification digest" style={styles.iconButton}>
            <BellIcon color={niche.ink} />
          </Pressable>
        </View>
      </View>

      <DisplayText italic size={titleSize} color={niche.ink} style={styles.title}>
        {niche.label}
      </DisplayText>

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
                selected ? { backgroundColor: niche.ink, borderColor: niche.ink } : { backgroundColor: 'transparent', borderColor: niche.line },
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}>
              <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : niche.ink }]}>{n.label}</Text>
              {!n.open ? <Text style={[styles.soon, { color: selected ? 'rgba(255,255,255,0.85)' : niche.inkSoft }]}>soon</Text> : null}
            </Pressable>
          );
        })}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/discover')} style={[styles.chip, styles.requestChip, { borderColor: niche.line }]}>
          <Text style={[styles.chipText, { color: niche.inkSoft, fontWeight: '500' }]}>+ Request a niche</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

/** Posts or Grid, as two small icon buttons. */
function LayoutSwitch({ value, onChange, ink, inkSoft }: { value: FeedLayout; onChange: (v: FeedLayout) => void; ink: string; inkSoft: string }) {
  const options: { id: FeedLayout; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'grid', label: 'Grid' },
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Feed layout" style={styles.switch}>
      {options.map((o) => {
        const selected = o.id === value;
        const Icon = o.id === 'posts' ? PostsLayoutIcon : GridLayoutIcon;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(o.id)}
            style={[styles.switchOption, selected ? styles.switchSelected : null]}>
            <Icon size={16} color={selected ? ink : inkSoft} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 17, letterSpacing: -0.4 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  title: { paddingHorizontal: 20, marginTop: -2 },
  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: 19, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 14, fontWeight: '600' },
  soon: { fontSize: 11, fontWeight: '600' },
  requestChip: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  switch: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.4)', marginRight: 4 },
  switchOption: { width: 42, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  switchSelected: { backgroundColor: '#FFFFFF' },
});
