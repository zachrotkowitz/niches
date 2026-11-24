import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { BellIcon, CheckIcon, ChevronLeftIcon, HeartIcon, LockIcon, MoreIcon } from '@/components/icons';
import { Avatar, DisplayText } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast, type ToastAction } from '@/components/toast';
import { canSee, chosenDish, parseDay, participants, type Rsvp } from '@/lib/plans';
import { cancelReminder, REMINDER_CHOICES, reminderDate, reminderLabel, planStart, scheduleReminder } from '@/lib/reminders';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

const RSVP_LABEL: Record<Rsvp, string> = { going: 'Going', maybe: 'Maybe', no: 'Can’t go' };
const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

/**
 * A plan (founder picked B's invitation card, Nov 19 2026; canvas page
 * "Plans"): on the cream background, a white invitation card with a strip
 * of the niche's color, the name, the day, the place, who's coming and the
 * Going / Maybe / Can't go buttons. Under it: the host's note as a quote,
 * dish votes, who brings what and the guest list. Writing happens in white boxes.
 */
export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [menu, setMenu] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newDish, setNewDish] = useState('');
  const [remindMenu, setRemindMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState('');

  const plan = state.plans.find((p) => p.id === id);
  const me = state.me;
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/plans'));

  if (!plan || !me || !canSee(plan, me.id)) {
    return (
      <View style={[styles.screen, { backgroundColor: ground.ground, paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }]}>
        <DisplayText size={30} color={ground.text}>This plan isn’t available.</DisplayText>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/plans')} style={styles.linkHit}>
          <Text style={[styles.link, { color: ground.text }]}>Back to plans</Text>
        </Pressable>
      </View>
    );
  }

  const niche = niches[plan.niche];

  // Messages about this niche come in its dark color (founder, Nov 24 2026).

  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const isHost = plan.ownerId === me.id;
  const host = usersById[plan.ownerId];
  const hostFirst = host?.displayName.split(' ')[0] ?? 'Someone';
  const myAnswer = plan.rsvps[me.id];
  const invited = plan.invitees.includes(me.id);
  const people = participants(plan);
  const isIn = isHost || invited || myAnswer === 'going' || myAnswer === 'maybe';
  const dish = chosenDish(plan);
  const claimed = plan.items.filter((i) => i.claimedBy).length;
  // Every Cooking plan gets dish votes and who brings what, however it was made (founder, Nov 19 2026).
  const cooking = plan.niche === 'cooking';
  const itemsTitle = cooking ? 'Who brings what' : niche.id === 'photography' ? 'Shot list' : 'What to bring';
  const reminder = state.planReminders[plan.id];
  const upcoming = planStart(plan).getTime() > Date.now();
  const setReminder = async (minutes: number | null) => {
    setRemindMenu(false);
    await cancelReminder(reminder?.notificationId);
    if (minutes === null) {
      actions.setPlanReminder(plan.id, null);
      toast('Reminder off');
      return;
    }
    const r = await scheduleReminder(plan, minutes);
    if (!r.ok) {
      actions.setPlanReminder(plan.id, null);
      toast(r.reason === 'past' ? 'That time has already passed' : 'Turn on notifications for Niches in Settings');
      return;
    }
    actions.setPlanReminder(plan.id, { minutes, notificationId: r.notificationId });
    toast(`We’ll remind you ${reminderLabel(minutes).toLowerCase()}`);
  };
  const saveItem = (itemId: string) => {
    const v = itemDraft.trim();
    if (v) actions.renameItem(plan.id, itemId, v);
    setEditingItem(null);
  };
  const going = people.filter((u) => u === plan.ownerId || plan.rsvps[u] === 'going').length;
  const longDay = parseDay(plan.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const statusOf = (uid: string) => (uid === plan.ownerId ? 'Host' : plan.rsvps[uid] ? RSVP_LABEL[plan.rsvps[uid]] : 'Invited');

  const answer = (r: Rsvp) => {
    const on = myAnswer === r;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    actions.rsvp(plan.id, me.id, on ? null : r);
    if (!on) toast(r === 'going' ? 'See you there' : r === 'maybe' ? 'Marked as maybe' : 'Thanks for letting them know');
  };
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
  const writeBox = (value: string, set: (v: string) => void, submit: () => void, label: string) => (
    <View style={styles.writeBox}>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={set}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="done"
        placeholder={label}
        placeholderTextColor={ground.muted}
        maxLength={60}
        selectionColor={ground.text}
        style={[styles.writeInput, { color: ground.text }, webInput]}
      />
      {value.trim() ? (
        <Pressable accessibilityRole="button" onPress={submit} hitSlop={8}>
          <Text style={[styles.link, { color: ground.text }]}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SurfaceProvider value={ground}>
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: ground.ground }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <View style={styles.nav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to plans" onPress={goBack} style={styles.iconButton}>
              <ChevronLeftIcon color={ground.text} />
            </Pressable>
            {isHost ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Plan options" onPress={() => setMenu(true)} style={styles.iconButton}>
                <MoreIcon color={ground.text} />
              </Pressable>
            ) : null}
          </View>

          {/* The invitation */}
          <View style={[styles.card, { shadowColor: ground.text }]}>
            <View style={[styles.band, { backgroundColor: niche.accent }]} />
            <View style={styles.cardBody}>
              <Eyebrow style={{ textAlign: 'center' }}>
                {isHost ? 'You’re hosting' : invited ? `${hostFirst} invites you to` : `${hostFirst} is hosting · open to join`}
              </Eyebrow>
              <Text accessibilityRole="header" style={[styles.title, { color: ground.text }]}>{plan.title}</Text>
              <Text style={[styles.when, { color: ground.muted }]}>
                {longDay}
                {plan.time ? ` · ${plan.time}` : ''}
              </Text>
              {plan.location ? <Text style={[styles.where, { color: ground.muted }]}>{plan.location}</Text> : null}
              <View style={styles.kindRow}>
                <View style={[styles.dot, { backgroundColor: niche.accent }]} />
                <Text style={[styles.kind, { color: ground.muted }]}>
                  {niche.label}
                </Text>
                {plan.visibility === 'private' ? <LockIcon size={12} color={ground.muted} /> : null}
                <Text style={[styles.kind, { color: ground.muted }]}>{plan.visibility === 'private' ? 'Private' : 'Public'}</Text>
              </View>
              <View style={styles.faces}>
                {people.slice(0, 6).map((uid, i) => (
                  <View key={uid} style={[styles.face, { marginLeft: i === 0 ? 0 : -8 }]}>
                    <Avatar user={usersById[uid]} size={30} />
                  </View>
                ))}
                {people.length > 6 ? <Text style={[styles.more, { color: ground.muted }]}>+{people.length - 6}</Text> : null}
              </View>
              {isHost ? (
                <Text style={[styles.hostLine, { color: ground.muted }]}>
                  {going - 1 > 0 ? `${going - 1} going` : 'No one has answered yet'}
                  {plan.invitees.length ? ` · ${plan.invitees.length} invited` : ''}
                </Text>
              ) : (
                <View accessibilityRole="radiogroup" accessibilityLabel={invited ? 'Are you in?' : 'Want to join?'} style={styles.rsvpRow}>
                  {(['going', 'maybe', 'no'] as Rsvp[]).map((r) => {
                    const on = myAnswer === r;
                    return (
                      <Pressable
                        key={r}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        onPress={() => answer(r)}
                        style={({ pressed }) => [styles.rsvp, { borderColor: ground.text, backgroundColor: on ? ground.text : 'transparent', transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                        <Text style={[styles.rsvpText, { color: on ? ground.ground : ground.text }]}>{RSVP_LABEL[r]}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Who leads the plan, and your own reminder. */}
          <Text style={[styles.hostNote, { color: ground.muted }]}>
            {isHost
              ? `You’re the host: you can change the plan, invite people${cooking ? ' and pick the dish' : ''}.`
              : `${hostFirst} is the host and can change the plan, invite people${cooking ? ' and pick the dish' : ''}.`}
          </Text>
          {isIn && upcoming ? (
            <Pressable accessibilityRole="button" accessibilityLabel={reminder ? `Reminder ${reminderLabel(reminder.minutes)}. Change it` : 'Set a reminder'} onPress={() => setRemindMenu(true)} style={[styles.remind, { borderColor: ground.line }]}>
              <BellIcon size={18} color={ground.text} />
              <Text style={[styles.remindText, { color: ground.text }]}>{reminder ? 'Reminder' : 'Remind me'}</Text>
              <Text style={[styles.remindValue, { color: reminder ? ground.text : ground.muted }]}>{reminder ? reminderLabel(reminder.minutes) : 'Choose when'}</Text>
            </Pressable>
          ) : null}

          {plan.notes ? (
            <View style={[styles.quote, { borderLeftColor: niche.accent }]}>
              <Text style={[styles.quoteText, { color: ground.text }]}>“{plan.notes}”</Text>
              <Text style={[styles.quoteBy, { color: ground.muted }]}>{isHost ? 'Your note' : hostFirst}</Text>
            </View>
          ) : null}

          {cooking ? (
            <View style={styles.block}>
              <View style={styles.titleRow}>
                <Text style={[styles.blockTitle, { color: ground.text }]}>{dish ? 'What we’re making' : 'Vote: what are we making?'}</Text>
                {!dish && plan.dishIdeas.length ? <Text style={[styles.count, { color: ground.muted }]}>{plan.dishIdeas.length} {plan.dishIdeas.length === 1 ? 'idea' : 'ideas'}</Text> : null}
              </View>
              {dish ? (
                <View style={[styles.row, { borderBottomColor: ground.line }]}>
                  <View style={[styles.check, { backgroundColor: niche.accent, borderColor: niche.accent }]}>
                    <CheckIcon size={13} strokeWidth={3} />
                  </View>
                  <Text style={[styles.dishName, { flex: 1, color: ground.text }]}>{dish.name}</Text>
                  {isHost ? (
                    <Pressable accessibilityRole="button" onPress={() => actions.chooseDish(plan.id, undefined)} style={styles.linkHit}>
                      <Text style={[styles.link, { color: ground.muted }]}>Change</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {!dish
                ? plan.dishIdeas
                    .slice()
                    .sort((a, b) => b.votes.length - a.votes.length)
                    .map((d) => {
                      const voted = d.votes.includes(me.id);
                      return (
                        <View key={d.id} style={[styles.row, { borderBottomColor: ground.line }]}>
                          <View style={{ flex: 1, gap: 1 }}>
                            <Text style={[styles.dishName, { color: ground.text }]}>{d.name}</Text>
                            <Text style={[styles.sub, { color: ground.muted }]}>suggested by {d.by === me.id ? 'you' : usersById[d.by]?.username}</Text>
                          </View>
                          {isHost ? (
                            <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${d.name}`} onPress={() => actions.chooseDish(plan.id, d.id)} style={styles.linkHit}>
                              <Text style={[styles.link, { color: ground.text }]}>Choose</Text>
                            </Pressable>
                          ) : null}
                          <Pressable
                            accessibilityRole="button"
                            disabled={!isIn}
                            accessibilityState={{ selected: voted, disabled: !isIn }}
                            accessibilityLabel={voted ? `Remove your vote for ${d.name}` : `Vote for ${d.name}`}
                            onPress={() => actions.toggleVote(plan.id, d.id, me.id)}
                            style={styles.vote}>
                            <HeartIcon size={18} filled={voted} color={voted ? niche.accent : ground.muted} />
                            <Text style={[styles.voteText, { color: voted ? ground.text : ground.muted, fontWeight: voted ? '700' : '500' }]}>{d.votes.length}</Text>
                          </Pressable>
                        </View>
                      );
                    })
                : null}
              {!dish && isIn ? writeBox(newDish, setNewDish, addDish, 'Suggest a dish') : null}
            </View>
          ) : null}

          {plan.items.length || isIn ? (
            <View style={styles.block}>
              <View style={styles.titleRow}>
                <Text style={[styles.blockTitle, { color: ground.text }]}>{itemsTitle}</Text>
                {plan.items.length ? <Text style={[styles.count, { color: ground.muted }]}>{claimed} of {plan.items.length} claimed</Text> : null}
              </View>
              {plan.items.map((it) => {
                const mine = it.claimedBy === me.id;
                const who = it.claimedBy ? usersById[it.claimedBy] : undefined;
                if (editingItem === it.id)
                  return (
                    <View key={it.id} style={[styles.row, { borderBottomColor: ground.line }]}>
                      <View style={[styles.writeBox, { flex: 1, marginTop: 0 }]}>
                        <TextInput
                          accessibilityLabel={`Rename ${it.name}`}
                          value={itemDraft}
                          onChangeText={setItemDraft}
                          onSubmitEditing={() => saveItem(it.id)}
                          autoFocus
                          maxLength={60}
                          selectionColor={ground.text}
                          style={[styles.writeInput, { color: ground.text }, webInput]}
                        />
                        <Pressable accessibilityRole="button" onPress={() => saveItem(it.id)} hitSlop={8}>
                          <Text style={[styles.link, { color: ground.text }]}>Save</Text>
                        </Pressable>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${it.name}`} onPress={() => (actions.removeItem(plan.id, it.id), setEditingItem(null), toast(`${it.name} removed`))} style={styles.linkHit}>
                        <Text style={[styles.link, { color: ground.muted }]}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                return (
                  <View key={it.id} style={[styles.row, { borderBottomColor: ground.line }]}>
                    <View style={[styles.check, { borderColor: it.claimedBy ? niche.accent : ground.muted, backgroundColor: it.claimedBy ? niche.accent : 'transparent' }]}>
                      {it.claimedBy ? <CheckIcon size={13} strokeWidth={3} /> : null}
                    </View>
                    {/* Anyone in the plan can tap an item to fix or remove it. */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${it.name}${who ? `, ${who.displayName} is bringing this` : ''}`}
                      accessibilityHint={isIn ? 'Change or remove it' : undefined}
                      disabled={!isIn}
                      onPress={() => (setEditingItem(it.id), setItemDraft(it.name))}
                      style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.itemName, { color: it.claimedBy && !mine ? ground.muted : ground.text }]}>{it.name}</Text>
                      {who ? <Text style={[styles.sub, { color: ground.muted }]}>{mine ? 'You’re bringing this' : `${who.displayName.split(' ')[0]} is bringing this`}</Text> : null}
                    </Pressable>
                    {isIn && (!it.claimedBy || mine) ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={mine ? `Stop bringing ${it.name}` : `I’ll bring ${it.name}`} onPress={() => actions.toggleClaim(plan.id, it.id, me.id)} style={styles.linkHit}>
                        <Text style={[styles.link, { color: mine ? ground.muted : ground.text }]}>{mine ? 'Undo' : plan.kind === 'outing' && niche.id === 'photography' ? 'I’ll shoot it' : 'I’ll bring it'}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
              {isIn ? writeBox(newItem, setNewItem, addItem, 'Add something') : null}
            </View>
          ) : null}

          <View style={styles.block}>
            <View style={styles.titleRow}>
              <Text style={[styles.blockTitle, { color: ground.text }]}>Who’s coming</Text>
              <Text style={[styles.count, { color: ground.muted }]}>{going} going</Text>
            </View>
            {people.map((uid) => {
              const u = usersById[uid];
              const status = statusOf(uid);
              return (
                <Pressable
                  key={uid}
                  accessibilityRole="button"
                  accessibilityLabel={`${u?.displayName ?? 'Someone'}, ${status}`}
                  onPress={() => (uid === me.id ? router.navigate('/profile') : router.push({ pathname: '/user/[id]', params: { id: uid } }))}
                  style={[styles.row, { borderBottomColor: ground.line }]}>
                  <Avatar user={u} size={34} />
                  <Text style={[styles.itemName, { flex: 1, color: ground.text }]}>{uid === me.id ? 'You' : u?.displayName}</Text>
                  <Text style={[styles.status, { color: status === 'Going' || status === 'Host' ? ground.text : ground.muted, fontWeight: status === 'Going' || status === 'Host' ? '700' : '500' }]}>{status}</Text>
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
              label: 'Edit plan',
              detail: 'Name, niche, day and time, place, notes and who’s invited.',
              onPress: () => {
                setMenu(false);
                router.push({ pathname: '/plans/new', params: { edit: plan.id } });
              },
            },
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
        <Sheet
          visible={remindMenu}
          onClose={() => setRemindMenu(false)}
          items={[
            ...REMINDER_CHOICES.filter((c) => (!c.needsTime || plan.time) && reminderDate(plan, c.minutes).getTime() > Date.now()).map((c) => ({
              label: c.label + (reminder?.minutes === c.minutes ? '  ✓' : ''),
              onPress: () => void setReminder(c.minutes),
            })),
            ...(reminder ? [{ label: 'No reminder', destructive: true, onPress: () => void setReminder(null) }] : []),
          ]}
        />
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 20, marginTop: 4, borderRadius: 26, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  band: { height: 10 },
  cardBody: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18, alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 41, textAlign: 'center' },
  when: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  where: { fontSize: 14, textAlign: 'center' },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  kind: { fontSize: 12, fontWeight: '600' },
  faces: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  face: { borderRadius: 17, borderWidth: 2, borderColor: '#FFFFFF' },
  more: { fontSize: 12, marginLeft: 6 },
  hostLine: { fontSize: 13, marginTop: 6 },
  rsvpRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  rsvp: { minHeight: 40, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rsvpText: { fontSize: 14, fontWeight: '700' },
  hostNote: { marginHorizontal: 24, marginTop: 12, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  remind: { marginHorizontal: 20, marginTop: 14, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth * 2, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  remindText: { fontSize: 15, fontWeight: '600' },
  remindValue: { marginLeft: 'auto', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  quote: { marginHorizontal: 20, marginTop: 22, paddingLeft: 14, borderLeftWidth: 2, gap: 4 },
  quoteText: { fontFamily: fonts.displayItalic, fontSize: 20, lineHeight: 26 },
  quoteBy: { fontSize: 12, fontWeight: '600' },
  block: { paddingHorizontal: 20, paddingTop: 26, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 },
  blockTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  count: { fontSize: 13 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  dishName: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  sub: { fontSize: 12 },
  itemName: { fontSize: 15 },
  status: { fontSize: 13 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vote: { minHeight: TOUCH, minWidth: TOUCH, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  voteText: { fontSize: 14, fontVariant: ['tabular-nums'] },
  linkHit: { minHeight: TOUCH, justifyContent: 'center' },
  link: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  writeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 14, minHeight: 46, borderRadius: 14, backgroundColor: '#FFFFFF' },
  writeInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
});
