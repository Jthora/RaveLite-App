/**
 * Attributes — the fifteen, five elements across three modalities. Shown
 * inside the Daily Sets page rather than as a sheet of its own: on Android,
 * Back stops reaching a sheet opened over another once it has been touched.
 *
 * Nothing here is assigned or spent. Every set, hold, glass and check-in
 * feeds the attributes it trains, the next level costs more than the last,
 * and practice alone stops at 85 — past that only a passed test counts.
 * Tap one to see what it is, how it's trained and where it stands.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {subscribeActivity} from '../../domain/activity/activity';
import {MODALITIES, type AttributeId} from '../../domain/attributes/attributes';
import {PRACTICE_CAP} from '../../domain/attributes/levels';
import {
  attributeSheet,
  type AttributeSheet,
  type AttributeStanding,
} from '../../domain/attributes/repository';
import {
  STANDARD_EVENTS,
  type StandardEvent,
} from '../../domain/standards/standards';
import {formatDuration} from '../../domain/training/grading';
import {ELEMENTS, ELEMENT_ORDER} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const EVENTS = new Map(STANDARD_EVENTS.map(e => [e.id, e]));

const formatValue = (event: StandardEvent, value: number) =>
  event.unit === 'seconds'
    ? formatDuration(value)
    : event.unit === 'percent'
    ? `${Math.round(value)}%`
    : event.unit === 'ratio'
    ? value.toFixed(2)
    : String(Math.round(value));

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

const modalityName = (id: string) =>
  MODALITIES.find(m => m.id === id)?.name ?? '';

/** What the level is standing on, in the order it matters. */
function lines(standing: AttributeStanding): string[] {
  const {attribute, practice, tested, testedBy, xp, toNext, today, idleDays} =
    standing;
  const out: string[] = [];
  const event = testedBy ? EVENTS.get(testedBy.eventId) : undefined;
  if (testedBy && event && tested !== undefined) {
    out.push(
      `${testedBy.name} — ${formatValue(event, testedBy.value)} on ${shortDate(
        testedBy.at,
      )} — sets it to ${tested}.`,
    );
  } else if (attribute.events.length === 0) {
    out.push('No test for this one yet, so practice is all there is.');
  }
  out.push(
    practice >= PRACTICE_CAP
      ? `Practice has taken it as far as it goes (${PRACTICE_CAP}). Only a test moves it now.`
      : `Practice: ${practice}, ${xp} of ${toNext} XP toward ${practice + 1}.`,
  );
  if (today > 0) {
    out.push(`+${today} XP today.`);
  }
  if (idleDays === undefined) {
    out.push('Nothing logged toward it yet.');
  } else if (idleDays > 14) {
    out.push(`Left alone ${idleDays} days — sliding a level a week.`);
  }
  return out;
}

function Row({
  standing,
  open,
  onToggle,
}: {
  standing: AttributeStanding;
  open: boolean;
  onToggle: () => void;
}) {
  const {attribute, level, practice, tested} = standing;
  const color = ELEMENTS[attribute.element].color;
  return (
    <Tap
      testID={`attribute-${attribute.id}`}
      variant="plain"
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{expanded: open}}
      accessibilityLabel={`${attribute.name}, level ${level}. ${attribute.gist}`}
      style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.name}>{attribute.name}</Text>
        <Text style={styles.mode}>{modalityName(attribute.modality)}</Text>
        <Text style={[styles.level, {color}]}>{level}</Text>
      </View>
      <View style={styles.bar}>
        <View
          style={[styles.fill, {width: `${level}%`, backgroundColor: color}]}
        />
        <View style={[styles.cap, {left: `${PRACTICE_CAP}%`}]} />
      </View>
      {open ? (
        <View style={styles.detail}>
          <Text style={styles.gist}>{attribute.gist}</Text>
          <Text style={styles.how}>{attribute.how}</Text>
          {lines(standing).map(line => (
            <Text key={line} style={styles.caption}>
              {line}
            </Text>
          ))}
          <Text style={styles.sign}>{attribute.sign}</Text>
        </View>
      ) : null}
      {!open && tested !== undefined && tested > practice ? (
        <Text style={styles.caption}>Tested</Text>
      ) : null}
    </Tap>
  );
}

export function Attributes() {
  const [sheet, setSheet] = useState<AttributeSheet>(() => attributeSheet());
  const [open, setOpen] = useState<AttributeId>();

  useEffect(() => subscribeActivity(() => setSheet(attributeSheet())), []);

  const byElement = useMemo(
    () =>
      ELEMENT_ORDER.map(element => ({
        element,
        standings: sheet.standings.filter(s => s.attribute.element === element),
      })),
    [sheet],
  );

  const {level, into, needs} = sheet.character;
  const bonus = Math.round((sheet.multiplier - 1) * 100);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CHARACTER</Text>
        <View style={styles.levelRow}>
          <Text style={styles.big}>{level}</Text>
          <Text style={styles.bigGoal}>
            {' '}
            · {into} / {needs} XP
          </Text>
        </View>
        <View style={styles.bar}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, (into / needs) * 100)}%`,
                backgroundColor: ELEMENTS.heart.color,
              },
            ]}
          />
        </View>
        <Text style={styles.caption}>
          Everything you finish feeds the attributes it trains. The next level
          always costs more than the last, and practice alone stops at{' '}
          {PRACTICE_CAP} — past that a passed test sets the number.
        </Text>
        <Text style={styles.note}>
          {bonus === 0
            ? 'Focus speeds up everything else once it passes 50.'
            : `Focus is ${bonus > 0 ? 'adding' : 'costing'} ${Math.abs(
                bonus,
              )}% of every attribute's XP.`}
        </Text>
      </View>

      {byElement.map(({element, standings}) => (
        <View key={element} style={styles.section}>
          <Text style={[styles.sectionTitle, {color: ELEMENTS[element].color}]}>
            {ELEMENTS[element].name.toUpperCase()}
          </Text>
          <View style={styles.card}>
            {standings.map(standing => (
              <Row
                key={standing.attribute.id}
                standing={standing}
                open={open === standing.attribute.id}
                onToggle={() =>
                  setOpen(
                    open === standing.attribute.id
                      ? undefined
                      : standing.attribute.id,
                  )
                }
              />
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.note}>
        Cardinal starts, fixed holds, mutable changes. Read a column and you get
        one kind of training: the first move, the hold, the change.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  big: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  bigGoal: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.textDim,
  },
  row: {
    paddingVertical: spacing.xs,
    gap: 6,
    minHeight: 48,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    ...t.body,
    fontWeight: '600',
    color: palette.text,
  },
  mode: {
    ...t.caption,
    color: palette.textMuted,
    flex: 1,
  },
  level: {
    ...t.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  fill: {
    height: 5,
  },
  cap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: palette.textMuted,
  },
  detail: {
    gap: 4,
    paddingTop: 2,
  },
  gist: {
    ...t.caption,
    color: palette.text,
  },
  how: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  sign: {
    ...t.caption,
    color: palette.textMuted,
  },
  note: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
});
