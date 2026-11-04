import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NICHE_BORDER } from '@/components/feed-grid';
import { LockIcon } from '@/components/icons';
import { Avatar } from '@/components/primitives';
import { chosenDish, dayOfMonth, kindLabel, monthShort, participants, weekdayShort, type Plan } from '@/lib/plans';
import { useNiches, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * A plan in a list. Plans from different niches sit together, so each card
 * gets the same niche-color border as posts on Discover and Saved.
 */
export function PlanCard({ plan }: { plan: Plan }) {
  const router = useRouter();
  const { state, usersById } = useStore();
  const niche = useNiches()[plan.niche];
  const people = participants(plan);
  const meId = state.me?.id;
  const myAnswer = meId ? plan.rsvps[meId] : undefined;
  const invitedNoAnswer = !!meId && plan.invitees.includes(meId) && !myAnswer;
  const claimed = plan.items.filter((i) => i.claimedBy).length;
  const dish = chosenDish(plan);

  const status =
    plan.ownerId === meId
      ? plan.invitees.length === 0 && plan.visibility === 'private'
        ? 'Just you'
        : 'Hosting'
      : invitedNoAnswer
        ? 'Invited · reply'
        : myAnswer === 'going'
          ? 'Going'
          : myAnswer === 'maybe'
            ? 'Maybe'
            : myAnswer === 'no'
              ? 'Can’t go'
              : plan.visibility === 'public'
                ? 'Open to join'
                : '';

  const detail =
    plan.kind === 'together'
      ? `${dish ? dish.name : `${plan.dishIdeas.length} dish ${plan.dishIdeas.length === 1 ? 'idea' : 'ideas'}`} · ${claimed} of ${plan.items.length} ingredients claimed`
      : plan.location ?? plan.notes ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kindLabel(plan.kind, plan.niche)} in ${niche.label}: ${plan.title}, ${weekdayShort(plan.date)} ${monthShort(plan.date)} ${dayOfMonth(plan.date)}${plan.time ? `, ${plan.time}` : ''}${status ? `. ${status}` : ''}`}
      onPress={() => router.push({ pathname: '/plans/[id]', params: { id: plan.id } })}
      style={({ pressed }) => [styles.card, { borderColor: niche.accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View style={[styles.date, { backgroundColor: niche.field }]}>
        <Text style={[styles.dow, { color: niche.inkSoft }]}>{weekdayShort(plan.date).toUpperCase()}</Text>
        <Text style={[styles.dom, { color: niche.ink }]}>{dayOfMonth(plan.date)}</Text>
        <Text style={[styles.mon, { color: niche.inkSoft }]}>{monthShort(plan.date)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.kind, { color: niche.ink }]}>
            {kindLabel(plan.kind, plan.niche)}
            {plan.time ? ` · ${plan.time}` : ''}
          </Text>
          {plan.visibility === 'private' ? <LockIcon size={13} color={colors.textMuted} /> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{plan.title}</Text>
        {detail ? <Text style={styles.detail} numberOfLines={1}>{detail}</Text> : null}
        <View style={styles.footer}>
          <View style={styles.faces}>
            {people.slice(0, 4).map((uid, i) => (
              <View key={uid} style={[styles.face, { marginLeft: i === 0 ? 0 : -8 }]}>
                <Avatar user={usersById[uid]} size={22} />
              </View>
            ))}
            {people.length > 4 ? <Text style={styles.more}>+{people.length - 4}</Text> : null}
          </View>
          {status ? (
            <Text style={[styles.status, invitedNoAnswer ? { color: niche.accent } : null]}>{status}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 18, borderWidth: NICHE_BORDER, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  date: { width: 66, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  dow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  dom: { fontSize: 26, fontWeight: '800', lineHeight: 30, fontVariant: ['tabular-nums'] },
  mon: { fontSize: 12, fontWeight: '600' },
  body: { flex: 1, minWidth: 0, padding: 12, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 21 },
  detail: { fontSize: 13, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  faces: { flexDirection: 'row', alignItems: 'center' },
  face: { borderRadius: 13, borderWidth: 2, borderColor: '#FFFFFF' },
  more: { fontSize: 12, color: colors.textMuted, marginLeft: 6 },
  status: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
});
