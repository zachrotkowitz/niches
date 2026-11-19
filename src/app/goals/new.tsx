import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { CheckIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { UnderlineTabs } from '@/components/underline-tabs';
import { useToast } from '@/components/toast';
import { BEST_UNITS, GOAL_TEMPLATES, type GoalKind, type GoalTemplate, type GoalVisibility } from '@/lib/goals';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, NICHE_ORDER, TOUCH, type NicheId } from '@/lib/theme';


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
  const appGround = useAppGround();

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

  const ground = groundSurface(appGround);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/goals'));
  const ideas = GOAL_TEMPLATES[nicheId].slice(0, 4);
  const stepper = (value: string, set: (v: string) => void, min = 1) => {
    const n = num(value) ?? 0;
    return (
      <View style={styles.steps}>
        <Pressable accessibilityRole="button" accessibilityLabel="Less" onPress={() => set(String(Math.max(min, n - 1)))} style={[styles.step, { borderColor: ground.text }]}>
          <Text style={[styles.stepText, { color: ground.text }]}>−</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => set(String(n + 1))} style={[styles.step, { borderColor: ground.text }]}>
          <Text style={[styles.stepText, { color: ground.text }]}>+</Text>
        </Pressable>
      </View>
    );
  };
  const switchLink = (lead: string, action: string, to: GoalKind) => (
    <Pressable accessibilityRole="button" onPress={() => setKind(to)} style={styles.switchRow}>
      <Text style={[styles.switchText, { color: ground.muted }]}>
        {lead} <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>{action}</Text>
      </Text>
    </Pressable>
  );
  const input = (value: string, set: (v: string) => void, label: string, width = 90, numeric = true) => (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={set}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      maxLength={numeric ? 7 : 20}
      selectionColor={ground.text}
      style={[styles.inlineInput, { color: ground.text, borderBottomColor: ground.muted, width }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
    />
  );

  return (
    <SurfaceProvider value={ground}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ground.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={close} style={styles.close}>
          <CloseIcon color={ground.text} />
        </Pressable>
        <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
          <DisplayText size={38} color={ground.text}>New goal</DisplayText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={save}
            style={({ pressed }) => [styles.savePill, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
            <Text style={[styles.saveText, { color: ground.ground }]}>Set goal</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12, marginHorizontal: -10 }}>
          <UnderlineTabs
            label="Niche"
            inset={0}
            value={nicheId}
            onChange={(k) => setNicheId(k as NicheId)}
            items={NICHE_ORDER.map((id) => ({ key: id, label: niches[id].label, color: niches[id].accent }))}
          />
        </View>

        {/* The goal itself, on white: the main thing on the page (founder, Nov 19 2026). Type it however you like. */}
        <View style={styles.goalCard}>
          <Eyebrow>Your goal</Eyebrow>
          <TextInput
            accessibilityLabel="Goal title"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={60}
            autoFocus={Platform.OS !== 'web'}
            selectionColor={ground.text}
            style={[styles.goalInput, { color: ground.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
          />
        </View>

        <View style={[styles.rows, { borderTopColor: ground.line }]}>
          {kind === 'habit' ? (
            <>
              <View style={[styles.trackRow, { borderBottomColor: ground.line }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Eyebrow>Check in</Eyebrow>
                  <Text style={[styles.trackValue, { color: ground.text }]}>{perWeek === 1 ? 'Once a week' : `${perWeek} times a week`}</Text>
                </View>
                <View style={styles.steps}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Fewer times a week" onPress={() => setPerWeek(Math.max(1, perWeek - 1))} style={[styles.step, { borderColor: ground.text, opacity: perWeek <= 1 ? 0.35 : 1 }]}>
                    <Text style={[styles.stepText, { color: ground.text }]}>−</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="More times a week" onPress={() => setPerWeek(Math.min(7, perWeek + 1))} style={[styles.step, { borderColor: ground.text, opacity: perWeek >= 7 ? 0.35 : 1 }]}>
                    <Text style={[styles.stepText, { color: ground.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>
              {switchLink('Counting toward a total instead?', 'Set a number to reach', 'total')}
            </>
          ) : kind === 'total' ? (
            <>
              <View style={[styles.trackRow, { borderBottomColor: ground.line }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Eyebrow>Reach</Eyebrow>
                  <View style={styles.inlineRow}>
                    {input(target, setTarget, 'Number to reach', 70)}
                    {input(unit, setUnit, 'Of what, like loaves', 120, false)}
                  </View>
                </View>
                {stepper(target, setTarget)}
              </View>
              {switchLink('Doing it every week instead?', 'Check in weekly', 'habit')}
              {nicheId === 'gym' ? switchLink('Chasing a time or a lift?', 'Track a personal best', 'best') : null}
            </>
          ) : (
            <>
              <View style={[styles.trackRow, { borderBottomColor: ground.line, flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
                <Eyebrow>Personal best</Eyebrow>
                <View style={styles.inlineRow}>
                  <Text style={[styles.inlineLabel, { color: ground.muted }]}>From</Text>
                  {input(start, setStart, 'Where you are now', 60)}
                  <Text style={[styles.inlineLabel, { color: ground.muted }]}>to</Text>
                  {input(target, setTarget, 'Your goal', 60)}
                  {input(unit, setUnit, 'Unit, like kg or min', 60, false)}
                </View>
                <View style={styles.inlineRow}>
                  {(['up', 'down'] as const).map((d) => (
                    <Pressable key={d} accessibilityRole="radio" accessibilityState={{ checked: d === direction }} onPress={() => setDirection(d)} style={styles.wordHit}>
                      <Text style={[styles.word, { color: d === direction ? ground.text : ground.muted, fontWeight: d === direction ? '700' : '500', borderBottomColor: d === direction ? ground.text : 'transparent' }]}>
                        {d === 'up' ? 'Higher is better' : 'Lower is better'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {switchLink('Doing it every week instead?', 'Check in weekly', 'habit')}
            </>
          )}
        </View>

        {/* A few ideas to get going (founder, Nov 19 2026: from mock 1, under the tracking). */}
        <View style={{ marginTop: 18 }}>
          <Eyebrow>Need an idea?</Eyebrow>
          <View style={{ marginTop: 4 }}>
            {ideas.map((tpl) => (
              <Pressable key={tpl.title} accessibilityRole="button" accessibilityLabel={`Use idea: ${tpl.title}`} onPress={() => applyTemplate(tpl)} style={({ pressed }) => [styles.idea, { borderBottomColor: ground.line, opacity: pressed ? 0.6 : 1 }]}>
                <PlusIcon size={15} color={ground.muted} strokeWidth={2.2} />
                <Text style={[styles.ideaText, { color: ground.text }]}>{tpl.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.foot, { borderTopColor: ground.line }]}>
          <View style={styles.footRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.footTitle, { color: ground.text }]}>Who can see it</Text>
              <Text style={[styles.footSub, { color: ground.muted }]}>{visibility === 'private' ? 'Only you see it. You can change this later.' : 'Shows on your profile’s Goals tab.'}</Text>
            </View>
            <View accessibilityRole="radiogroup" accessibilityLabel="Who can see it" style={styles.toggle}>
              {(['private', 'profile'] as GoalVisibility[]).map((v) => {
                const on = visibility === v;
                return (
                  <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setVisibility(v)} style={[styles.toggleItem, on && { backgroundColor: '#FFFFFF' }]}>
                    <Text style={[styles.toggleText, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500' }]}>{v === 'private' ? 'Private' : 'Public'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {visibility === 'profile' ? (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: hideNumbers }} onPress={() => setHideNumbers(!hideNumbers)} style={styles.hideRow}>
              <View style={[styles.box, hideNumbers ? { backgroundColor: ground.text, borderColor: ground.text } : { borderColor: ground.muted }]}>{hideNumbers ? <CheckIcon size={14} strokeWidth={2.8} /> : null}</View>
              <Text style={[styles.footSub, { color: ground.text }]}>Hide my numbers from others</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  close: { width: TOUCH, height: TOUCH, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1 },
  savePill: { minHeight: 40, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700' },
  goalCard: { marginTop: 16, padding: 16, borderRadius: 22, backgroundColor: '#FFFFFF', gap: 6, shadowColor: '#1F1A14', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  goalInput: { fontFamily: fonts.display, fontSize: 32, lineHeight: 37, minHeight: 80, paddingVertical: 2, textAlignVertical: 'top' },
  rows: { marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  trackRow: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  trackValue: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34 },
  steps: { flexDirection: 'row', gap: 8 },
  step: { width: TOUCH, height: TOUCH, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, lineHeight: 24 },
  switchRow: { minHeight: TOUCH, justifyContent: 'center' },
  switchText: { fontSize: 14 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 },
  inlineInput: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, borderBottomWidth: 1, paddingVertical: 2 },
  inlineLabel: { fontSize: 14, paddingBottom: 6 },
  wordHit: { minHeight: 36, justifyContent: 'center' },
  word: { fontSize: 14, paddingBottom: 4, borderBottomWidth: 2 },
  idea: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  ideaText: { fontSize: 15, flexShrink: 1 },
  foot: { marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth * 2, paddingTop: 14, gap: 10 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footTitle: { fontSize: 15, fontWeight: '700' },
  footSub: { fontSize: 12, lineHeight: 17 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: 'rgba(31,26,20,0.07)' },
  toggleItem: { minHeight: 36, paddingHorizontal: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14 },
  hideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: TOUCH },
  box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
