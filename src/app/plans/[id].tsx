import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, HeartIcon, LockIcon, MoreIcon, PlusIcon } from '@/components/icons';
import { Avatar, Button, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { canSee, chosenDish, dayLabel, kindLabel, participants, type Rsvp } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';

const RSVP_LABEL: Record<Rsvp, string> = { going: 'Going', maybe: 'Maybe', no: 'Can’t go' };

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const [menu, setMenu] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newDish, setNewDish] = useState('');

  const plan = state.plans.find((p) => p.id === id);
  const me = state.me;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/plans'));

  if (!plan || !me || !canSee(plan, me.id)) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }]}>
        <Text style={{ fontSize: 17, color: colors.text }}>This plan isn’t available.</Text>
        <Button label="Back to plans" onPress={() => router.replace('/plans')} />
      </View>
    );
  }

  const niche = niches[plan.niche];
  const isHost = plan.ownerId === me.id;
  const host = usersById[plan.ownerId];
  const myAnswer = plan.rsvps[me.id];
  const people = participants(plan);
  const isIn = isHost || plan.invitees.includes(me.id) || myAnswer === 'going' || myAnswer === 'maybe';
  const dish = chosenDish(plan);
  const claimed = plan.items.filter((i) => i.claimedBy).length;
  const itemsTitle = plan.kind === 'together' ? 'Who’s bringing what' : plan.kind === 'meal' ? 'Shopping list' : niche.id === 'photography' ? 'Shot list' : 'What to bring';

  const statusOf = (uid: string) => (uid === plan.ownerId ? 'Host' : plan.rsvps[uid] ? RSVP_LABEL[plan.rsvps[uid]] : 'Invited');

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    actions.addItem(plan.id, v);
    setNewItem('');
  };
  const addDish = () => {
    const v = newDish.trim();
    if (!v) return;
    actions.addDishIdea(plan.id, v, me.id);
    setNewDish('');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: niche.field, paddingTop: insets.top + 4 }]}>
          <View style={styles.nav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to plans" onPress={goBack} style={styles.iconButton}>
              <ChevronLeftIcon color={niche.ink} />
            </Pressable>
            {isHost ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Plan options" onPress={() => setMenu(true)} style={styles.iconButton}>
                <MoreIcon color={niche.ink} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.kind, { color: niche.inkSoft }]}>
              {niche.label} · {kindLabel(plan.kind, plan.niche)}
            </Text>
            <DisplayText size={32} color={niche.ink}>{plan.title}</DisplayText>
            <Text style={[styles.when, { color: niche.ink }]}>
              {dayLabel(plan.date)}
              {plan.time ? ` · ${plan.time}` : ''}
            </Text>
            {plan.location ? <Text style={[styles.where, { color: niche.inkSoft }]}>{plan.location}</Text> : null}
            <View style={styles.hostRow}>
              <Avatar user={host} size={26} />
              <Text style={[styles.hostText, { color: niche.inkSoft }]}>{isHost ? 'You’re hosting' : `Hosted by ${host?.username ?? 'someone'}`}</Text>
              <View style={[styles.badge, { borderColor: niche.inkSoft }]}>
                {plan.visibility === 'private' ? <LockIcon size={11} color={niche.inkSoft} /> : null}
                <Text style={[styles.badgeText, { color: niche.inkSoft }]}>{plan.visibility === 'private' ? 'Private' : 'Public'}</Text>
              </View>
            </View>
          </View>
        </View>

        {!isHost ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{plan.invitees.includes(me.id) ? `${host?.displayName.split(' ')[0] ?? 'They'} invited you. Are you in?` : 'Want to join?'}</Text>
            <View style={styles.rsvpRow}>
              {(['going', 'maybe', 'no'] as Rsvp[]).map((r) => {
                const on = myAnswer === r;
                return (
                  <Pressable
                    key={r}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => {
                      actions.rsvp(plan.id, me.id, on ? null : r);
                      if (!on) toast(r === 'going' ? 'See you there' : r === 'maybe' ? 'Marked as maybe' : 'Thanks for letting them know');
                    }}
                    style={({ pressed }) => [styles.rsvp, on ? { backgroundColor: niche.accent, borderColor: niche.accent } : null, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                    <Text style={[styles.rsvpText, { color: on ? '#FFFFFF' : colors.textBody }]}>{RSVP_LABEL[r]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {plan.notes ? (
          <View style={styles.block}>
            <Text style={styles.notes}>{plan.notes}</Text>
          </View>
        ) : null}

        {plan.kind === 'together' ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>What we’re making</Text>
            {dish ? (
              <View style={[styles.chosen, { backgroundColor: niche.field }]}>
                <View style={[styles.check, { backgroundColor: niche.accent }]}>
                  <CheckIcon size={16} strokeWidth={3} />
                </View>
                <Text style={[styles.chosenText, { color: niche.ink }]}>{dish.name}</Text>
                {isHost ? (
                  <Pressable accessibilityRole="button" onPress={() => actions.chooseDish(plan.id, undefined)} style={styles.smallButton}>
                    <Text style={[styles.smallButtonText, { color: niche.ink }]}>Change</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={styles.hint}>{isHost ? 'Everyone votes; you pick the winner.' : 'Vote for the dishes you want. The host picks the winner.'}</Text>
            )}
            {!dish
              ? plan.dishIdeas
                  .slice()
                  .sort((a, b) => b.votes.length - a.votes.length)
                  .map((d) => {
                    const voted = d.votes.includes(me.id);
                    return (
                      <View key={d.id} style={styles.ideaRow}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.ideaName}>{d.name}</Text>
                          <Text style={styles.ideaBy}>
                            {d.votes.length} {d.votes.length === 1 ? 'vote' : 'votes'} · suggested by {d.by === me.id ? 'you' : usersById[d.by]?.username}
                          </Text>
                        </View>
                        {isIn ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: voted }}
                            accessibilityLabel={voted ? `Remove your vote for ${d.name}` : `Vote for ${d.name}`}
                            onPress={() => actions.toggleVote(plan.id, d.id, me.id)}
                            style={[styles.vote, voted ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>
                            <HeartIcon size={16} filled={voted} color={voted ? '#FFFFFF' : colors.textSecondary} />
                            <Text style={[styles.voteText, { color: voted ? '#FFFFFF' : colors.textSecondary }]}>{voted ? 'Voted' : 'Vote'}</Text>
                          </Pressable>
                        ) : null}
                        {isHost ? (
                          <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${d.name}`} onPress={() => actions.chooseDish(plan.id, d.id)} style={styles.smallButton}>
                            <Text style={[styles.smallButtonText, { color: niche.accent }]}>Choose</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })
              : null}
            {!dish && isIn ? (
              <View style={styles.addRow}>
                <TextInput accessibilityLabel="Suggest a dish" value={newDish} onChangeText={setNewDish} onSubmitEditing={addDish} placeholder="Suggest a dish" placeholderTextColor="#6B7178" maxLength={60} style={styles.input} selectionColor={niche.accent} />
                <Pressable accessibilityRole="button" accessibilityLabel="Add dish idea" onPress={addDish} style={[styles.addButton, { backgroundColor: niche.accent, opacity: newDish.trim() ? 1 : 0.4 }]}>
                  <PlusIcon size={18} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {plan.items.length || isIn ? (
          <View style={styles.block}>
            <View style={styles.titleRow}>
              <Text style={styles.blockTitle}>{itemsTitle}</Text>
              {plan.items.length && plan.kind !== 'meal' ? <Text style={styles.count}>{claimed} of {plan.items.length} claimed</Text> : null}
            </View>
            {plan.items.map((it) => {
              const mine = it.claimedBy === me.id;
              const who = it.claimedBy ? usersById[it.claimedBy] : undefined;
              return (
                <View key={it.id} style={[styles.itemRow, mine ? { backgroundColor: niche.field } : null]}>
                  <View style={[styles.itemCheck, it.claimedBy ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>
                    {it.claimedBy ? <CheckIcon size={13} strokeWidth={3} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={[styles.itemName, it.claimedBy && !mine ? { color: colors.textMuted } : null]}>{it.name}</Text>
                    {who ? <Text style={styles.itemWho}>{mine ? 'You’re bringing this' : `${who.username} is bringing this`}</Text> : null}
                  </View>
                  {isIn && (!it.claimedBy || mine) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={mine ? `Stop bringing ${it.name}` : `I’ll bring ${it.name}`}
                      onPress={() => actions.toggleClaim(plan.id, it.id, me.id)}
                      style={[styles.claim, mine ? null : { borderColor: niche.accent }]}>
                      <Text style={[styles.claimText, { color: mine ? colors.textMuted : niche.accent }]}>{mine ? 'Undo' : plan.kind === 'outing' && niche.id === 'photography' ? 'I’ll shoot it' : 'I’ll bring it'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {isIn ? (
              <View style={styles.addRow}>
                <TextInput accessibilityLabel={`Add to ${itemsTitle}`} value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} placeholder="Add something" placeholderTextColor="#6B7178" maxLength={60} style={styles.input} selectionColor={niche.accent} />
                <Pressable accessibilityRole="button" accessibilityLabel="Add item" onPress={addItem} style={[styles.addButton, { backgroundColor: niche.accent, opacity: newItem.trim() ? 1 : 0.4 }]}>
                  <PlusIcon size={18} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Who’s coming · {people.filter((u) => u === plan.ownerId || plan.rsvps[u] === 'going').length}</Text>
          {people.map((uid) => {
            const u = usersById[uid];
            const status = statusOf(uid);
            return (
              <Pressable
                key={uid}
                accessibilityRole="button"
                accessibilityLabel={`${u?.displayName ?? 'Someone'}, ${status}`}
                onPress={() => (uid === me.id ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: uid } }))}
                style={styles.personRow}>
                <Avatar user={u} size={36} />
                <Text style={styles.personName}>{uid === me.id ? 'You' : u?.displayName}</Text>
                <Text style={[styles.personStatus, status === 'Going' || status === 'Host' ? { color: niche.accent } : null]}>{status}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Sheet
        visible={menu}
        onClose={() => setMenu(false)}
        items={[
          {
            label: plan.visibility === 'private' ? 'Make public' : 'Make private',
            detail: plan.visibility === 'private' ? 'Show it on your profile so anyone can join.' : 'Only you and the people you invited will see it.',
            onPress: () => {
              setMenu(false);
              actions.updatePlan(plan.id, { visibility: plan.visibility === 'private' ? 'public' : 'private' });
              toast(plan.visibility === 'private' ? 'Plan is public' : 'Plan is private');
            },
          },
          {
            label: 'Cancel plan',
            destructive: true,
            detail: 'Deletes it for everyone you invited.',
            onPress: () => {
              setMenu(false);
              actions.deletePlan(plan.id);
              toast('Plan cancelled');
              goBack();
            },
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  hero: { paddingBottom: 22 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  heroBody: { paddingHorizontal: 20, gap: 6 },
  kind: { fontSize: 13, fontWeight: '700' },
  when: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  where: { fontSize: 15 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  hostText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  block: { paddingHorizontal: 20, paddingTop: 22, gap: 10 },
  blockTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  hint: { fontSize: 14, color: colors.textMuted, lineHeight: 19 },
  notes: { fontSize: 15, lineHeight: 22, color: colors.textBody, padding: 14, borderRadius: 14, backgroundColor: colors.surface },
  rsvpRow: { flexDirection: 'row', gap: 8 },
  rsvp: { flex: 1, minHeight: TOUCH, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  rsvpText: { fontSize: 15, fontWeight: '700' },
  chosen: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chosenText: { flex: 1, fontSize: 17, fontWeight: '700' },
  ideaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  ideaName: { fontSize: 15, fontWeight: '600', color: colors.text },
  ideaBy: { fontSize: 12, color: colors.textMuted },
  vote: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteText: { fontSize: 13, fontWeight: '700' },
  smallButton: { minHeight: TOUCH, paddingHorizontal: 8, justifyContent: 'center' },
  smallButtonText: { fontSize: 14, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 10, marginHorizontal: -10, borderRadius: 12 },
  itemCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  itemWho: { fontSize: 12, color: colors.textMuted },
  claim: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1.5, borderColor: 'transparent', justifyContent: 'center' },
  claimText: { fontSize: 13, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  addButton: { width: TOUCH + 4, height: TOUCH + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH + 4 },
  personName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  personStatus: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
});
