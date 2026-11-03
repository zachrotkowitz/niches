import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, DisplayText } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { colors, NICHE_ORDER, NICHES, TOUCH } from '@/lib/theme';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const [request, setRequest] = useState('');
  const [thanks, setThanks] = useState(false);

  const submit = () => {
    const name = request.trim();
    if (!name) return;
    actions.requestNiche(name);
    setRequest('');
    setThanks(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <DisplayText>Discover</DisplayText>
          <Text style={styles.sub}>Pick a niche to step into. Each one is its own feed.</Text>
        </View>

        <View style={styles.list}>
          {NICHE_ORDER.map((id) => {
            const n = NICHES[id];
            const notified = !!state.notify[id];
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={n.open ? `Open ${n.label}` : `${n.label}, coming soon`}
                onPress={() => {
                  actions.setNiche(id);
                  router.navigate('/');
                }}
                style={({ pressed }) => [styles.card, { backgroundColor: n.field, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <DisplayText size={24} color={n.ink}>{n.label}</DisplayText>
                  <Text style={[styles.status, { color: n.inkSoft }]}>
                    {n.open ? 'Open now' : notified ? 'Coming soon · we’ll tell you' : 'Coming soon'}
                  </Text>
                </View>
                <View style={[styles.dot, { backgroundColor: n.accent }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.request}>
          <Text style={styles.requestTitle}>Request a niche</Text>
          <Text style={styles.requestBody}>What should open next? We open the most-requested niches once their first creators sign on.</Text>
          <TextInput
            accessibilityLabel="Niche you want"
            value={request}
            onChangeText={(t) => {
              setRequest(t);
              setThanks(false);
            }}
            placeholder="e.g. Gardening, Climbing, Ceramics"
            placeholderTextColor="#6B7178"
            maxLength={40}
            onSubmitEditing={submit}
            returnKeyType="send"
            style={styles.input}
            selectionColor={NICHES[state.niche].accent}
          />
          <Button label="Send request" color={NICHES[state.niche].accent} disabled={!request.trim()} onPress={submit} />
          {thanks ? <Text accessibilityRole="alert" style={styles.thanks}>Thanks. We’ll count your vote.</Text> : null}
          {state.nicheRequests.length > 0 ? (
            <Text style={styles.mine}>You’ve asked for: {state.nicheRequests.join(', ')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  head: { paddingHorizontal: 20, gap: 8 },
  sub: { fontSize: 15, color: colors.textMuted },
  list: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  card: { minHeight: 84, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  status: { fontSize: 13, fontWeight: '600' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  request: { margin: 20, marginTop: 28, padding: 18, borderRadius: 20, backgroundColor: colors.surface, gap: 12 },
  requestTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  requestBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  thanks: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  mine: { fontSize: 13, color: colors.textMuted },
});
