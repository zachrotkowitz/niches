import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { colors, NICHE_ORDER, NICHES, type NicheId } from '@/lib/theme';

type Tab = 'all' | NicheId;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const [tab, setTab] = useState<Tab>('all');
  const me = state.me;
  if (!me) return null;

  const mine = state.posts.filter((p) => p.authorId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  // One profile, with a tab for each niche you've posted in.
  const nicheTabs = NICHE_ORDER.filter((id) => mine.some((p) => p.niche === id));
  const shown = tab === 'all' ? mine : mine.filter((p) => p.niche === tab);

  const confirmReset = () => {
    const run = () => actions.resetDemo();
    const message = 'This signs you out and deletes your demo account, posts, saves and comments from this device.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) run();
      return;
    }
    Alert.alert('Delete demo account?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}>
      <View style={styles.head}>
        <View style={styles.identity}>
          <Avatar user={me} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <DisplayText size={26}>{me.displayName}</DisplayText>
            <Text style={styles.handle}>{me.username}</Text>
          </View>
        </View>
        {me.bio ? <Text style={styles.bio}>{me.bio}</Text> : null}
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['all', ...nicheTabs] as Tab[]).map((t) => {
          const selected = t === tab;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setTab(t)} style={[styles.tab, { borderBottomColor: selected ? colors.text : 'transparent' }]}>
              <Text style={[styles.tabText, { color: selected ? colors.text : '#6B7178' }]}>{t === 'all' ? 'All' : NICHES[t].label}</Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyBody}>Share your first dish, a question, or progress toward a goal.</Text>
          <Button label="Create a post" color={NICHES[state.niche].accent} onPress={() => router.navigate('/create')} />
        </View>
      ) : (
        <View style={styles.grid}>
          {shown.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Open post: ${p.caption}`}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
              style={styles.cell}>
              {p.kind === 'text' ? (
                <View style={[styles.textCell, { backgroundColor: NICHES[p.niche].field }]}>
                  <Text style={[styles.textCellText, { color: NICHES[p.niche].ink }]} numberOfLines={4}>{p.caption}</Text>
                </View>
              ) : (
                <MediaPlaceholder post={p} height={128} showLabel={false} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.settings}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <Row label="Notifications" value="Daily digest at 6:00 PM (coming soon)" />
        <Row label="Born" value={`${me.birthDate} · never shown`} />
        <Button tone="outline" label="Delete demo account" textStyle={{ color: colors.danger }} onPress={confirmReset} style={{ marginTop: 8 }} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  head: { paddingHorizontal: 20, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  handle: { fontSize: 14, color: colors.textMuted },
  bio: { fontSize: 15, lineHeight: 21, color: colors.text },
  tabs: { flexDirection: 'row', marginTop: 18, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingTop: 2 },
  cell: { width: '33%', flexGrow: 1, maxWidth: '33.4%' },
  textCell: { height: 128, padding: 10, justifyContent: 'flex-end' },
  textCellText: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  empty: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: colors.surface, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  settings: { marginTop: 28, paddingHorizontal: 20, gap: 4 },
  settingsTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 2 },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  rowValue: { fontSize: 13, color: colors.textMuted },
});
