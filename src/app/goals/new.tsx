import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { BEST_UNITS, GOAL_TEMPLATES, type GoalKind, type GoalTemplate, type GoalVisibility } from '@/lib/goals';
import { useNiches, useStore } from '@/lib/store';
import { colors, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';

const KINDS: { id: GoalKind; label: string; sub: string }[] = [
  { id: 'habit', label: 'Weekly habit', sub: 'Do it a few times a week' },
  { id: 'total', label: 'Reach a number', sub: 'Like 20 loaves' },
  { id: 'best', label: 'Personal best', sub: 'Like a lift or a time' },
];

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

/** Set a goal. Private by default; templates per niche, none of them about weight. */
export default function NewGoalScreen() {
  const params = useLocalSearchParams<{ niche?: NicheId }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();

  const [nicheId, setNicheId] = useState<NicheId>(params.niche && NICHE_ORDER.includes(params.niche) ? params.niche : state.niche);
  const [kind, setKind] = useState<GoalKind>('habit');
  const [title, setTitle] = useState('');
  const [perWeek, setPerWeek] = useState(3);
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [start, setStart] = useState('');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [visibility, setVisibility] = useState<GoalVisibility>('private');
  const [hideNumbers, setHideNumbers] = useState(false);

  const niche = niches[nicheId];
  const t = num(target);
  const s0 = num(start);
  const ready =
    !!state.me &&
    title.trim().length > 0 &&
    (kind === 'habit' || (t !== undefined && t > 0)) &&
    (kind !== 'best' || (s0 !== undefined && unit.length > 0 && s0 !== t));

  const applyTemplate = (tpl: GoalTemplate) => {
    setKind(tpl.kind);
    setTitle(tpl.title);
    if (tpl.perWeek) setPerWeek(tpl.perWeek);
    setTarget(tpl.target !== undefined ? String(tpl.target) : '');
    setUnit(tpl.unit ?? '');
    setStart(tpl.start !== undefined ? String(tpl.start) : '');
    setDirection(tpl.direction ?? 'up');
  };

  const save = () => {
    if (!ready || !state.me) return;
    const id = actions.createGoal({
      userId: state.me.id,
      niche: nicheId,
      kind,
      title: title.trim(),
      perWeek: kind === 'habit' ? perWeek : undefined,
      target: kind === 'habit' ? undefined : t,
      unit: kind === 'habit' ? undefined : unit.trim() || undefined,
      start: kind === 'best' ? s0 : undefined,
      direction: kind === 'best' ? direction : undefined,
      visibility,
      hideNumbers: visibility === 'profile' ? hideNumbers : undefined,
    });
    toast(visibility === 'private' ? 'Goal set. Only you can see it.' : 'Goal set and on your profile');
    router.replace({ pathname: '/goals/[id]', params: { id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/goals'))} style={styles.navButton}>
          <Text style={[styles.navText, { color: niche.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>New goal</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={save} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: niche.accent, fontWeight: '700', opacity: ready ? 1 : 0.4 }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Field label="Niche">
          <View style={styles.wrap}>
            {NICHE_ORDER.map((id) => {
              const on = id === nicheId;
              return (
                <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setNicheId(id)} style={[styles.chip, { borderColor: niches[id].accent }, on ? { backgroundColor: niches[id].accent } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{niches[id].label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Start from an idea">
          <View style={styles.wrap}>
            {GOAL_TEMPLATES[nicheId].map((tpl) => {
              const on = title === tpl.title;
              return (
                <Pressable key={tpl.title} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => applyTemplate(tpl)} style={[styles.idea, { backgroundColor: on ? niche.accent : niche.field }]}>
                  <Text style={[styles.ideaText, { color: on ? '#FFFFFF' : niche.ink }]}>{tpl.title}</Text>
                </Pressable>
              );
            })}
          </View>
          {nicheId === 'gym' ? (
            <Text style={styles.note}>Gym goals track what you can do, not what you weigh. There’s no weight-loss goal, on purpose.</Text>
          ) : null}
        </Field>

        <Field label="Kind of goal">
          <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
            {KINDS.map((k) => {
              const on = k.id === kind;
              return (
                <Pressable key={k.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setKind(k.id)} style={[styles.option, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                  <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.optionTitle}>{k.label}</Text>
                    <Text style={styles.optionSub}>{k.sub}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Your goal">
          <TextInput accessibilityLabel="Goal title" value={title} onChangeText={setTitle} maxLength={60} placeholder={GOAL_TEMPLATES[nicheId][0].title} placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
        </Field>

        {kind === 'habit' ? (
          <Field label="Times a week">
            <View style={styles.row}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => {
                const on = n === perWeek;
                return (
                  <Pressable key={n} accessibilityRole="radio" accessibilityLabel={`${n} ${n === 1 ? 'time' : 'times'} a week`} accessibilityState={{ checked: on }} onPress={() => setPerWeek(n)} style={[styles.num, on ? { backgroundColor: niche.accent } : null]}>
                    <Text style={[styles.numText, on ? { color: '#FFFFFF' } : null]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.note}>Your streak counts weeks, not days. Busy week? Mark it as a rest week and the streak keeps going.</Text>
          </Field>
        ) : kind === 'total' ? (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Target">
                <TextInput accessibilityLabel="Target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="20" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
              </Field>
            </View>
            <View style={{ flex: 1.4 }}>
              <Field label="Of what">
                <TextInput accessibilityLabel="Unit" value={unit} onChangeText={setUnit} maxLength={20} placeholder="loaves" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
              </Field>
            </View>
          </View>
        ) : (
          <>
            <Field label="Measured in">
              <View style={styles.wrap}>
                {BEST_UNITS.map((u) => {
                  const on = u === unit;
                  return (
                    <Pressable key={u} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setUnit(u)} style={[styles.unit, on ? { backgroundColor: niche.accent } : null]}>
                      <Text style={[styles.numText, on ? { color: '#FFFFFF' } : null]}>{u}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Where you are now">
                  <TextInput accessibilityLabel="Starting point" value={start} onChangeText={setStart} keyboardType="decimal-pad" placeholder="60" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Goal">
                  <TextInput accessibilityLabel="Target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="100" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
                </Field>
              </View>
            </View>
            <View style={styles.segment} accessibilityRole="radiogroup">
              {(['up', 'down'] as const).map((d) => {
                const on = d === direction;
                return (
                  <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDirection(d)} style={[styles.segmentOption, on ? styles.segmentOn : null]}>
                    <Text style={[styles.segmentText, { color: on ? colors.text : colors.textMuted }]}>{d === 'up' ? 'Higher is better' : 'Lower is better (times)'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Field label="Who can see this goal">
          <View style={{ gap: 8 }}>
            {(['private', 'profile'] as GoalVisibility[]).map((v) => {
              const on = v === visibility;
              return (
                <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.option, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                  <View style={[styles.radio, on ? { borderColor: niche.accent } : null]}>{on ? <View style={[styles.radioDot, { backgroundColor: niche.accent }]} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.optionTitle}>{v === 'private' ? 'Just me' : 'On my profile'}</Text>
                    <Text style={styles.optionSub}>{v === 'private' ? 'Nobody else sees it.' : 'People who visit your profile see the goal and your progress posts.'}</Text>
                  </View>
                </Pressable>
              );
            })}
            {visibility === 'profile' ? (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: hideNumbers }} onPress={() => setHideNumbers(!hideNumbers)} style={styles.check}>
                <View style={[styles.box, hideNumbers ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>{hideNumbers ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.optionTitle}>Hide my numbers</Text>
                  <Text style={styles.optionSub}>Others see the goal and a progress bar, but no counts, weights or times.</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </Field>

        <Button label="Set goal" color={niche.accent} disabled={!ready} onPress={save} />
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

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  idea: { minHeight: 38, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ideaText: { fontSize: 14, fontWeight: '600' },
  note: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionSub: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF', width: '100%', minWidth: 0 },
  num: { flex: 1, height: TOUCH, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  unit: { minWidth: 52, height: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, fontWeight: '700', color: colors.textBody },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F0F1EE' },
  segmentOption: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentOn: { backgroundColor: '#FFFFFF', shadowColor: '#14161A', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
