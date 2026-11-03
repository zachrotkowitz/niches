import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/icons';
import { Button, DisplayText } from '@/components/primitives';
import { ageFrom, parseBirthDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import { colors, fonts, NICHES, TOUCH } from '@/lib/theme';

const cooking = NICHES.cooking;
const USERNAME = /^[a-z0-9._]{3,24}$/;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { actions } = useStore();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [inUS, setInUS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooYoung, setTooYoung] = useState(false);

  const submit = () => {
    const handle = username.trim().toLowerCase().replace(/^@/, '');
    if (!name.trim()) return setError('Add your name so people know who’s posting.');
    if (!USERNAME.test(handle)) return setError('Usernames are 3–24 characters: letters, numbers, dots and underscores.');
    const birth = parseBirthDate(month, day, year);
    if (!birth) return setError('Check your birthday. Use numbers, like 4 / 17 / 2001.');
    if (!inUS) return setError('This early version of Niches is only open in the US.');
    if (ageFrom(birth) < 18) {
      setError(null);
      setTooYoung(true);
      return;
    }
    setError(null);
    actions.signUp({ displayName: name.trim(), username: handle, birthDate: birth.toISOString().slice(0, 10) });
  };

  if (tooYoung) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top + 40 }]}>
        <DisplayText size={30} color={cooking.ink}>Niches is 18+ for now</DisplayText>
        <Text style={styles.body}>This early version is only for adults while we build the safety tools younger members deserve. We hope to see you later.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.wordmark}>niches</Text>
          <DisplayText size={40} color={cooking.ink}>You pick the niche. The feed ends. Likes are private.</DisplayText>
          <Text style={[styles.body, { color: cooking.inkSoft }]}>Start in Cooking. Art, Photography and Gym open soon.</Text>
        </View>

        <View style={styles.form}>
          <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
          <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" placeholder="e.g. maya.cooks" />

          <View style={{ gap: 6 }}>
            <Text style={styles.label} nativeID="dobLabel">Birthday</Text>
            <View style={styles.dobRow}>
              <TextInput accessibilityLabel="Birth month" placeholder="MM" placeholderTextColor="#6B7178" value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} style={[styles.input, styles.dob]} selectionColor={cooking.accent} />
              <TextInput accessibilityLabel="Birth day" placeholder="DD" placeholderTextColor="#6B7178" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} style={[styles.input, styles.dob]} selectionColor={cooking.accent} />
              <TextInput accessibilityLabel="Birth year" placeholder="YYYY" placeholderTextColor="#6B7178" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={[styles.input, styles.dob, { flex: 1.6 }]} selectionColor={cooking.accent} />
            </View>
            <Text style={styles.hint}>You must be 18 or older. We never show your birthday.</Text>
          </View>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: inUS }} onPress={() => setInUS((v) => !v)} style={styles.checkRow}>
            <View style={[styles.box, inUS ? { backgroundColor: cooking.accent, borderColor: cooking.accent } : null]}>
              {inUS ? <CheckIcon size={16} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.checkText}>I live in the United States</Text>
          </Pressable>

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          ) : null}

          <Button label="Join Niches" color={cooking.accent} onPress={submit} />
          <Text style={styles.hint}>This is a demo. Your account and posts stay on this device for now.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...input }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#6B7178" selectionColor={cooking.accent} style={styles.input} {...input} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  center: { paddingHorizontal: 24, gap: 14 },
  hero: { backgroundColor: cooking.field, marginHorizontal: 12, borderRadius: 28, padding: 22, paddingTop: 26, gap: 14 },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 18, color: cooking.ink, letterSpacing: -0.4 },
  body: { fontSize: 16, lineHeight: 23, color: colors.textSecondary },
  form: { paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  dobRow: { flexDirection: 'row', gap: 8 },
  // width: 0 lets the three boxes share the row instead of using their default text width.
  dob: { flex: 1, width: 0, minWidth: 0, textAlign: 'center' },
  hint: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  checkText: { fontSize: 15, color: colors.text },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger, fontWeight: '500' },
});
