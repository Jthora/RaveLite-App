/**
 * The character sheet — the fifteen attributes as they are drawn in the
 * design: five elements down, three kinds of training across. One column
 * starts a move, one holds, one changes, so a column says as much as a
 * row. Those columns were headed Cardinal, Fixed and Mutable until the
 * plain words replaced them; the ids in `MODALITIES` still carry the old
 * names, because they are storage keys and not prose.
 *
 * Shown inside the Daily Sets page rather than as a sheet of its own: on
 * Android, Back stops reaching a sheet opened over another once it has
 * been touched. Tapping an attribute opens its card.
 *
 * Perks, traits and flaws will sit under the grid once they are agreed;
 * until then the sheet is the level, the grid and today's balance.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {ElementGlyph} from '../../components/icons/ElementGlyph';
import {
  activityForDay,
  subscribeActivity,
} from '../../domain/activity/activity';
import {isHarmony} from '../../domain/activity/par';
import {dailyPar} from '../../domain/profile/repository';
import {daysTrained, pointsByElement} from '../../domain/activity/stats';
import {MODALITIES, type Modality} from '../../domain/attributes/attributes';
import {PRACTICE_CAP} from '../../domain/attributes/levels';
import {
  attributeSheet,
  type AttributeSheet as Sheet,
  type AttributeStanding,
} from '../../domain/attributes/repository';
import type {InfoRef} from '../../domain/info/info';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

function Cell({
  standing,
  onOpen,
}: {
  standing?: AttributeStanding;
  onOpen?: (ref: InfoRef) => void;
}) {
  if (!standing) {
    return <View style={styles.cell} />;
  }
  const {attribute, level, practice, tested} = standing;
  const color = ELEMENTS[attribute.element].color;
  return (
    <Tap
      testID={`cell-${attribute.id}`}
      variant="plain"
      onPress={
        onOpen ? () => onOpen({kind: 'attribute', id: attribute.id}) : undefined
      }
      disabled={!onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${attribute.name}, level ${level}. ${attribute.gist}`}
      style={styles.cell}>
      <View style={styles.cellBody}>
        <Text style={styles.cellName} numberOfLines={1}>
          {attribute.name}
        </Text>
        <Text style={[styles.cellLevel, {color}]}>{level}</Text>
        <View style={styles.bar}>
          <View
            style={[styles.fill, {width: `${level}%`, backgroundColor: color}]}
          />
          <View style={[styles.cap, {left: `${PRACTICE_CAP}%`}]} />
        </View>
        {tested !== undefined && tested > practice ? (
          <Text style={styles.cellNote}>tested</Text>
        ) : null}
      </View>
    </Tap>
  );
}

function ElementRow({
  element,
  standings,
  points,
  par,
  onOpen,
}: {
  element: ElementId;
  standings: AttributeStanding[];
  points: number;
  par: number;
  onOpen?: (ref: InfoRef) => void;
}) {
  const el = ELEMENTS[element];
  const at = Math.min(1, points / par);
  const byMode = (mode: Modality) =>
    standings.find(s => s.attribute.modality === mode);
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <ElementGlyph element={el} size={16} color={el.color} />
        <Text style={[styles.rowName, {color: el.color}]} numberOfLines={1}>
          {el.name}
        </Text>
        <Text style={styles.rowPoints}>
          {Math.round(points)}/{par}
        </Text>
        <View style={styles.parBar}>
          <View
            style={[
              styles.fill,
              {width: `${at * 100}%`, backgroundColor: el.color},
            ]}
          />
        </View>
      </View>
      <View style={styles.cells}>
        {MODALITIES.map(mode => (
          <Cell key={mode.id} standing={byMode(mode.id)} onOpen={onOpen} />
        ))}
      </View>
    </View>
  );
}

/** The sheet opens at this level, or after this many days trained. */
const UNLOCK_LEVEL = 2;
const UNLOCK_DAYS = 7;

export function CharacterSheet({
  onInfo,
}: {onInfo?: (ref: InfoRef) => void} = {}) {
  const [sheet, setSheet] = useState<Sheet>(() => attributeSheet());
  const [points, setPoints] = useState(() => pointsByElement(activityForDay()));

  useEffect(
    () =>
      subscribeActivity(() => {
        setSheet(attributeSheet());
        setPoints(pointsByElement(activityForDay()));
      }),
    [],
  );

  const rows = useMemo(
    () =>
      ELEMENT_ORDER.map(element => ({
        element,
        standings: sheet.standings.filter(s => s.attribute.element === element),
      })),
    [sheet],
  );

  const {level, into, needs} = sheet.character;
  const par = dailyPar();
  // A grid of fifteen zeroes is not a character sheet, it is a reproach.
  // It opens at level 2, or after a week of training — days trained, not
  // days since installing, because a week of owning an app is not a week
  // of training and this is a record of the second one.
  const days = daysTrained();
  const locked = level < UNLOCK_LEVEL && days < UNLOCK_DAYS;
  const harmony = isHarmony(points, par);
  const bonus = Math.round((sheet.multiplier - 1) * 100);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.levelRow}>
          <Text style={styles.big}>{level}</Text>
          <View style={styles.levelText}>
            <Text accessibilityRole="header" style={styles.eyebrow}>
              LEVEL
            </Text>
            <Text style={styles.caption}>
              {into} of {needs} points to level {level + 1}
            </Text>
          </View>
          <View style={styles.pentagram}>
            {ELEMENT_ORDER.map(id => (
              <ElementGlyph
                key={id}
                element={ELEMENTS[id]}
                size={16}
                color={
                  (points[id] ?? 0) >= par
                    ? ELEMENTS[id].color
                    : palette.textMuted
                }
              />
            ))}
          </View>
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
          {harmony
            ? 'All five bars above reached their goal today. That is a Harmony day.'
            : 'Fill all five bars above in one day and it counts as a Harmony day. Anything you log raises the levels it trains.'}
        </Text>
        {bonus > 0 ? (
          <Text style={styles.note}>
            Your Focus level is high, so everything you log earns {bonus}% more
            points.
          </Text>
        ) : null}
      </View>

      <Text style={styles.note}>
        These 15 levels rise from what you log. Each column is one kind of
        training: starting a move, holding, changing. Levels run 0 to 100. Doing
        the work raises one to {PRACTICE_CAP}; past that, only a passed test
        counts.
      </Text>

      <View style={styles.modeRow}>
        <View style={styles.modeSpacer} />
        {MODALITIES.map(mode => (
          <Text key={mode.id} style={styles.modeName}>
            {mode.name}
          </Text>
        ))}
      </View>

      {locked ? (
        <View testID="sheet-locked" style={styles.locked}>
          <Text style={styles.lockedTitle}>Your sheet is not open yet</Text>
          <Text style={styles.lockedBody}>
            Your 15 attributes grow from what you do, so they all start at zero.
            The sheet opens at level 2, or after 7 days of training.
          </Text>
          <Text style={styles.lockedBody}>
            {days === 0
              ? 'Nothing logged yet. Answer a chime to start.'
              : `${days} ${days === 1 ? 'day' : 'days'} trained so far.`}
          </Text>
        </View>
      ) : (
        rows.map(({element, standings}) => (
          <ElementRow
            key={element}
            element={element}
            standings={standings}
            points={points[element] ?? 0}
            par={par}
            onOpen={onInfo}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelText: {
    flex: 1,
  },
  pentagram: {
    flexDirection: 'row',
    gap: 6,
  },
  big: {
    fontSize: 40,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  modeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  modeSpacer: {
    width: 74,
  },
  modeName: {
    ...t.caption,
    flex: 1,
    color: palette.textFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  rowHead: {
    width: 70,
    gap: 2,
  },
  rowName: {
    ...t.caption,
    fontWeight: '700',
  },
  rowPoints: {
    ...t.caption,
    color: palette.textFaint,
    fontVariant: ['tabular-nums'],
  },
  parBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellBody: {
    gap: 2,
    width: '100%',
  },
  cellName: {
    ...t.caption,
    color: palette.textDim,
  },
  cellLevel: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cellNote: {
    ...t.caption,
    fontSize: 10,
    color: palette.textFaint,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  cap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: palette.textMuted,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  locked: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  lockedTitle: {
    ...t.subtitle,
    color: palette.text,
  },
  lockedBody: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 18,
  },
  note: {
    ...t.caption,
    color: palette.textFaint,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
