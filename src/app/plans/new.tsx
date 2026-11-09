import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, PlusIcon } from '@/components/icons';
import { Avatar, Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { CLOCK_TIMES, dayOfMonth, isoDay, kindLabel, kindsFor, MEAL_TIMES, type PlanKind, type Visibility } from '@/lib/plans';
import { SEED_USERS } from '@/lib/seed';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

const PLACEHOLDERS: Record<PlanKind, string> = {
  meal: 'e.g. Miso butter corn and rice',
  together: 'e.g. Fresh pasta night',
  outing: 'e.g. Sunrise shoot at the pier',
};

const ITEM_PROMPTS: Record<PlanKind, { label: string; placeholder: string }> = {
  meal: { label: 'Shopping list (optional)', placeholder: 'Add an ingredient' },
  together: { label: 'Ingredients people can claim', placeholder: 'e.g. Pecorino Romano' },
  outing: { label: 'What to bring or shoot (optional)', placeholder: 'e.g. A wide shot of the bridge' },
};

export default function NewPlanScreen() {
  const params = useLocalSearchParams<{ niche?: NicheId }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();

  const [nicheId, setNicheId] = useState<NicheId>(params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche);
  const [kind, setKind] = useState<PlanKind>(kindsFor(nicheId)[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(isoDay(1));
  const [time, setTime] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [dishes, setDishes] = useState<string[]>([]);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('private');

  const niche = niches[nicheId];
  const ready = title.trim().length > 0 && !!state.me;
  const days = Array.from({ length: 21 }, (_, i) => isoDay(i));
  const times = kind === 'meal' ? MEAL_TIMES : CLOCK_TIMES;
  // People you follow first, then everyone else in the demo.
  const people = SEED_USERS.slice().sort((a, b) => Number(!!state.following[b.id]) - Number(!!state.following[a.id]));

  const pickNiche = (id: NicheId) => {
    setNicheId(id);
    if (!kindsFor(id).includes(kind)) setKind(kindsFor(id)[0]);
  };
  const pickKind = (k: PlanKind) => {
    setKind(k);
    if (time && !(k === 'meal' ? MEAL_TIMES : CLOCK_TIMES).includes(time)) setTime(undefined);
  };

  const create = () => {
    if (!ready || !state.me) return;
    const id = actions.createPlan({
      ownerId: state.me.id,
      niche: nicheId,
      kind,
      title: title.trim(),
      date,
      time,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      visibility,
      invitees,
      items,
      dishIdeas: kind === 'together' ? dishes : [],
    });
    toast(invitees.length ? `Plan made. ${invitees.length} ${invitees.length === 1 ? 'person' : 'people'} invited.` : 'Plan made');
    router.replace({ pathname: '/plans/[id]', params: { id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'transparent' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/plans'))} style={styles.navButton}>
          <Text style={[styles.navText, { color: niche.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>New plan</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={create} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: niche.accent, fontWeight: '700', opacity: ready ? 1 : 0.4 }]}>Create</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Field label="Niche">
          <View style={styles.wrap}>
            {NICHE_ORDER.map((id) => {
              const n = niches[id];
              const on = id === nicheId;
              return (
                <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => pickNiche(id)} style={[styles.chip, { borderColor: n.accent, borderWidth: 2.5 }, on ? { backgroundColor: n.accent } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{n.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {kindsFor(nicheId).length > 1 ? (
          <View accessibilityRole="radiogroup" accessibilityLabel="Kind of plan" style={styles.segment}>
            {kindsFor(nicheId).map((k) => {
              const on = k === kind;
              return (
                <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => pickKind(k)} style={[styles.segmentOption, on ? styles.segmentOn : null]}>
                  <Text style={[styles.segmentText, { color: on ? colors.text : colors.textMuted }]}>{kindLabel(k, nicheId)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.kindNote, { color: niche.ink, backgroundColor: niche.field }]}>{kindLabel(kind, nicheId)}: what, where and when.</Text>
        )}

        <Field label={kind === 'meal' ? 'What are you cooking?' : 'Name your plan'}>
          <TextInput accessibilityLabel="Plan name" value={title} onChangeText={setTitle} placeholder={PLACEHOLDERS[kind]} placeholderTextColor="#6B7178" maxLength={60} style={styles.input} selectionColor={niche.accent} />
        </Field>

        <Field label="Day">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }} contentInset={{ left: 20 }}>
            <View style={{ width: 12 }} />
            {days.map((d, i) => {
              const on = d === date;
              return (
                <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDate(d)} style={[styles.day, on ? { backgroundColor: niche.accent } : null]}>
                  <Text style={[styles.dayName, on ? { color: '#FFFFFF' } : null]}>{i === 0 ? 'Today' : i === 1 ? 'Tmrw' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <Text style={[styles.dayNum, on ? { color: '#FFFFFF' } : null]}>{dayOfMonth(d)}</Text>
                </Pressable>
              );
            })}
            <View style={{ width: 12 }} />
          </ScrollView>
        </Field>

        <Field label={kind === 'meal' ? 'Which meal?' : 'Time (optional)'}>
          <View style={styles.wrap}>
            {times.map((t) => {
              const on = t === time;
              return (
                <Pressable key={t} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setTime(on ? undefined : t)} style={[styles.chip, on ? { backgroundColor: colors.text, borderColor: colors.text } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {kind !== 'meal' ? (
          <Field label="Where (optional)">
            <TextInput accessibilityLabel="Where" value={location} onChangeText={setLocation} placeholder={kind === 'together' ? 'e.g. My place' : 'e.g. Waterfront path, north end'} placeholderTextColor="#6B7178" maxLength={80} style={styles.input} selectionColor={niche.accent} />
          </Field>
        ) : null}

        {kind === 'together' ? (
          <ListEditor
            label="Dish ideas everyone can vote on"
            placeholder="e.g. Cacio e pepe"
            values={dishes}
            onChange={setDishes}
            accent={niche.accent}
          />
        ) : null}

        <ListEditor label={ITEM_PROMPTS[kind].label} placeholder={ITEM_PROMPTS[kind].placeholder} values={items} onChange={setItems} accent={niche.accent} />

        <Field label="Notes (optional)">
          <TextInput accessibilityLabel="Notes" value={notes} onChangeText={setNotes} multiline maxLength={500} placeholder="Anything people should know" placeholderTextColor="#6B7178" style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]} selectionColor={niche.accent} />
        </Field>

        <Field label={kind === 'meal' ? 'Share with friends (optional)' : 'Invite people'}>
          <View style={{ gap: 4 }}>
            {people.map((u) => {
              const on = invitees.includes(u.id);
              return (
                <Pressable
                  key={u.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`Invite ${u.displayName}`}
                  onPress={() => setInvitees(on ? invitees.filter((x) => x !== u.id) : [...invitees, u.id])}
                  style={styles.person}>
                  <Avatar user={u} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{u.displayName}</Text>
                    <Text style={styles.personSub}>{u.username}{state.following[u.id] ? ' · you follow' : ''}</Text>
                  </View>
                  <View style={[styles.box, on ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>{on ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Who can see it">
          <View style={{ gap: 8 }}>
            {(['private', 'public'] as Visibility[]).map((v) => {
              const on = v === visibility;
              return (
                <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.option, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                  <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.optionTitle}>{v === 'private' ? 'Private' : 'Public'}</Text>
                    <Text style={styles.optionSub}>{v === 'private' ? 'Only you and the people you invite.' : 'On your profile. Anyone can ask to join.'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Button label="Create plan" color={niche.accent} disabled={!ready} onPress={create} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/** A list of short strings you can add to and remove from. */
function ListEditor({ label, placeholder, values, onChange, accent }: { label: string; placeholder: string; values: string[]; onChange: (v: string[]) => void; accent: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <Field label={label}>
      {values.map((v, i) => (
        <View key={`${v}-${i}`} style={styles.listRow}>
          <Text style={styles.listText}>{v}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${v}`} onPress={() => onChange(values.filter((_, j) => j !== i))} style={styles.remove}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.addRow}>
        <TextInput accessibilityLabel={label} value={draft} onChangeText={setDraft} onSubmitEditing={add} returnKeyType="done" placeholder={placeholder} placeholderTextColor="#6B7178" maxLength={60} style={[styles.input, { flex: 1 }]} selectionColor={accent} />
        <Pressable accessibilityRole="button" accessibilityLabel="Add" accessibilityState={{ disabled: !draft.trim() }} onPress={add} style={[styles.addButton, { backgroundColor: accent, opacity: draft.trim() ? 1 : 0.4 }]}>
          <PlusIcon size={18} />
        </Pressable>
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F0F1EE' },
  segmentOption: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: '#FFFFFF', shadowColor: '#14161A', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  kindNote: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, overflow: 'hidden' },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  day: { width: 54, minHeight: 64, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayName: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, borderRadius: 12, backgroundColor: colors.surface },
  listText: { flex: 1, fontSize: 15, color: colors.text },
  remove: { minHeight: TOUCH, paddingHorizontal: 12, justifyContent: 'center' },
  removeText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addButton: { width: TOUCH + 4, height: TOUCH + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH + 8 },
  personName: { fontSize: 15, fontWeight: '600', color: colors.text },
  personSub: { fontSize: 13, color: colors.textMuted },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionSub: { fontSize: 13, color: colors.textMuted },
});
