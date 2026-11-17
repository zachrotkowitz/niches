import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatRating, Stars } from '@/components/diary';
import { Eyebrow } from '@/components/discover-parts';
import { ChevronLeftIcon, LockIcon } from '@/components/icons';
import { useSurface } from '@/components/surface';
import { Text } from '@/components/text';
import { diaryWords, type LogEntry } from '@/lib/diary';
import { logPhoto } from '@/lib/demo-photos';
import { isoDay, parseDay } from '@/lib/plans';
import { useNiches } from '@/lib/store';
import { fonts, TOUCH } from '@/lib/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** "2026-11" → "November" (this year) or "November 2025". */
function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return y === new Date().getFullYear() ? MONTHS[m - 1] : `${MONTHS[m - 1]} ${y}`;
}

function Thumb({ log, size, radius }: { log: LogEntry; size: number; radius: number }) {
  const niche = useNiches()[log.niche];
  const photo = logPhoto(log);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: log.mediaColor ?? niche.field }}>
      {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
}

/** One line in the diary list: the day as a big number, the name in serif, stars, a small photo. */
function DayRow({ log, showPrivacy }: { log: LogEntry; showPrivacy: boolean }) {
  const surface = useSurface();
  const router = useRouter();
  const niche = useNiches()[log.niche];
  const day = parseDay(log.date);
  const locked = showPrivacy && log.visibility === 'private';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${log.title}, ${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${formatRating(log.rating)} stars${locked ? ', private' : ''}`}
      onPress={() => router.push({ pathname: '/log/[id]', params: { id: log.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: surface.line, opacity: pressed ? 0.75 : 1 }]}>
      <View style={styles.dayCol}>
        <Text style={[styles.dayNum, { color: surface.text }]}>{day.getDate()}</Text>
        <Text style={[styles.weekday, { color: surface.muted }]}>{WEEKDAYS[day.getDay()]}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={[styles.title, { color: surface.text }]} numberOfLines={2}>{log.title}</Text>
        <View style={styles.meta}>
          <Stars rating={log.rating} size={13} color={niche.accent} />
          {locked ? <LockIcon size={12} color={surface.muted} /> : null}
        </View>
      </View>
      <Thumb log={log} size={58} radius={12} />
    </Pressable>
  );
}

/** A: the diary as a list, newest first, grouped by month (founder, Nov 17 2026). */
export function DiaryList({ logs, showPrivacy }: { logs: LogEntry[]; showPrivacy: boolean }) {
  const groups: { key: string; logs: LogEntry[] }[] = [];
  for (const l of logs) {
    const key = l.date.slice(0, 7);
    if (groups[groups.length - 1]?.key !== key) groups.push({ key, logs: [] });
    groups[groups.length - 1].logs.push(l);
  }
  return (
    <View>
      {groups.map((g) => (
        <View key={g.key} style={{ marginTop: 18 }}>
          <Eyebrow>{monthLabel(g.key)}</Eyebrow>
          {g.logs.map((l) => (
            <DayRow key={l.id} log={l} showPrivacy={showPrivacy} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * B's calendar, as the other way to see the diary: a month at a time, each
 * day you logged something shows its photo. Tap a day to open it. Under it,
 * a small card about the month that only uses your own numbers.
 */
export function DiaryCalendar({ logs }: { logs: LogEntry[] }) {
  const surface = useSurface();
  const router = useRouter();
  const niches = useNiches();
  const today = isoDay();
  const [month, setMonth] = useState(() => (logs[0]?.date ?? today).slice(0, 7));
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  const byDay = new Map<number, LogEntry[]>();
  for (const l of logs) if (l.date.startsWith(month)) byDay.set(Number(l.date.slice(8)), [...(byDay.get(Number(l.date.slice(8))) ?? []), l]);
  const inMonth = logs.filter((l) => l.date.startsWith(month));
  const best = [...inMonth].sort((a, b) => b.rating - a.rating)[0];
  const words = diaryWords(best?.niche ?? inMonth[0]?.niche ?? 'cooking');
  const step = (d: number) => {
    const n = new Date(y, m - 1 + d, 1);
    setMonth(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`);
  };
  const isFuture = month >= today.slice(0, 7);
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.calHead}>
        <Text style={[styles.monthName, { color: surface.text }]}>{monthLabel(month)}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => step(-1)} style={styles.arrow}>
            <ChevronLeftIcon size={20} color={surface.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" accessibilityState={{ disabled: isFuture }} disabled={isFuture} onPress={() => step(1)} style={[styles.arrow, { opacity: isFuture ? 0.3 : 1 }]}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <ChevronLeftIcon size={20} color={surface.text} />
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[styles.dow, { color: surface.muted }]}>{d}</Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.slot} />;
          const iso = `${month}-${String(d).padStart(2, '0')}`;
          const entries = byDay.get(d);
          const isToday = iso === today;
          if (!entries)
            return (
              <View key={iso} style={styles.slot}>
                <View style={[styles.cell, isToday && { borderWidth: 1.5, borderColor: surface.text }]}>
                  <Text style={[styles.cellNum, { color: surface.muted, opacity: iso > today ? 0.45 : 1 }]}>{d}</Text>
                </View>
              </View>
            );
          const top = entries[0];
          return (
            <View key={iso} style={styles.slot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${MONTHS[m - 1]} ${d}: ${entries.map((e) => e.title).join(', ')}`}
              onPress={() => router.push({ pathname: '/log/[id]', params: { id: top.id } })}
              style={({ pressed }) => [styles.cell, { overflow: 'hidden', backgroundColor: top.mediaColor ?? niches[top.niche].field, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
              {logPhoto(top) ? <Image source={logPhoto(top)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              <Text style={styles.photoNum}>{d}</Text>
              {entries.length > 1 ? <Text style={styles.more}>+{entries.length - 1}</Text> : null}
            </Pressable>
            </View>
          );
        })}
      </View>

      {inMonth.length ? (
        <View style={styles.summary}>
          <Text style={[styles.summaryTitle, { color: surface.text }]}>
            {inMonth.length} {inMonth.length === 1 ? words.thing : words.things} in {MONTHS[m - 1]}
          </Text>
          {best ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/log/[id]', params: { id: best.id } })} style={styles.bestRow}>
              <Thumb log={best} size={40} radius={10} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.bestLabel, { color: surface.muted }]}>Your best this month</Text>
                <Text style={[styles.bestTitle, { color: surface.text }]} numberOfLines={1}>{best.title}</Text>
              </View>
              <Stars rating={best.rating} size={13} color={niches[best.niche].accent} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.nothing, { color: surface.muted }]}>Nothing logged in {MONTHS[m - 1]}.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  dayCol: { width: 40, alignItems: 'center' },
  dayNum: { fontFamily: fonts.display, fontSize: 32, lineHeight: 34 },
  weekday: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 25 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  monthName: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  arrow: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  slot: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2.5 },
  cell: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontSize: 13 },
  photoNum: { position: 'absolute', left: 4, top: 2, fontSize: 11, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 3 },
  more: { position: 'absolute', right: 3, bottom: 2, fontSize: 10, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 3 },
  summary: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', gap: 12 },
  summaryTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bestLabel: { fontSize: 12 },
  bestTitle: { fontSize: 15, fontWeight: '700' },
  nothing: { marginTop: 18, fontSize: 14, textAlign: 'center' },
});
