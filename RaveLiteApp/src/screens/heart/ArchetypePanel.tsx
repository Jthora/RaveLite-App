/**
 * What you're training for.
 *
 * One question a stranger can answer, in place of twenty they can't. It
 * writes the same fields the other panels write — packs, day shape,
 * tracks — and then gets out of the way: everything it moved is visible
 * below it, and changing one afterwards is an ordinary edit, not a
 * departure from a preset.
 *
 * Once set up, picking is two taps. The first shows what would change and
 * what it costs; the second does it. Nobody should lose a tuned program to
 * a mis-tap on a list. During setup there is nothing to lose yet, so one
 * tap takes it — a first tap that only turned the card red, then Next,
 * used to leave a stranger on the author's program.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  ARCHETYPES,
  archetypeById,
  type ArchetypeId,
} from '../../domain/profile/archetypes';
import {
  DAY_SHAPES,
  densityFor,
  parFor,
  roundsFor,
} from '../../domain/program/density';
import {DAILY_PAR} from '../../domain/activity/par';
import {PACKS, drillsOf} from '../../domain/profile/packs';
import {
  hasHistory,
  loadArchetype,
  loadProfile,
} from '../../domain/profile/repository';
import {applyArchetype} from '../../domain/profile/setup';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {palette, radius, spacing, type as t} from '../../theme';

/** "9 rounds of sets · 5 packs · +142 drills · goal 20 points". */
function preview(id: ArchetypeId): string {
  const archetype = archetypeById(id);
  if (!archetype) {
    return '';
  }
  const rounds = roundsFor(archetype.shape);
  const drills = PACKS.filter(p => archetype.packs.includes(p.id)).reduce(
    (sum, p) => sum + drillsOf(p).length,
    0,
  );
  const shape = DAY_SHAPES.find(s => s.id === archetype.shape);
  return [
    `${rounds} ${rounds === 1 ? 'round' : 'rounds'} of sets`,
    shape ? shape.name.toLowerCase() : '',
    `${archetype.packs.length} ${
      archetype.packs.length === 1 ? 'pack' : 'packs'
    }`,
    `+${drills} drills`,
    `goal ${parFor(densityFor(archetype.shape), DAILY_PAR)} points`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** A picture and a colour for each way of training. */
export const ARCHETYPE_SYMBOL: Record<ArchetypeId, SymbolName> = {
  raver: 'raver',
  guardian: 'guardian',
  monk: 'monk',
  operator: 'operator',
  'desk-rebel': 'deskRebel',
  comeback: 'comeback',
  'flow-artist': 'flowArtist',
  'super-hero': 'superHero',
  'night-shift': 'nightShift',
  parent: 'parent',
  'festival-six': 'festivalSix',
};

/** Whether a program has been set up or trained, and so could be lost. */
function hasSomethingToLose(): boolean {
  return loadProfile().setUpAt !== undefined || hasHistory();
}

export function ArchetypePanel() {
  const [chosen, setChosen] = useState<ArchetypeId | undefined>(loadArchetype);
  /** Tapped once, showing what it would do. */
  const [asking, setAsking] = useState<ArchetypeId | undefined>();

  const press = (id: ArchetypeId) => {
    if (asking !== id && hasSomethingToLose()) {
      setAsking(id);
      return;
    }
    applyArchetype(id);
    setChosen(id);
    setAsking(undefined);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>WHAT YOU'RE TRAINING FOR</Text>
      <Text style={styles.caption}>
        Picking one sets your packs, your day and your daily sets. You can
        change any of them later.
      </Text>
      {ARCHETYPES.map(archetype => {
        const on = chosen === archetype.id;
        const open = asking === archetype.id;
        return (
          <Tap
            key={archetype.id}
            testID={`archetype-${archetype.id}`}
            variant="plain"
            onPress={() => press(archetype.id)}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            accessibilityLabel={`${archetype.name}, for someone who ${
              archetype.forWhom
            }. ${preview(archetype.id)}.${
              open ? ' Tap again to choose it.' : ''
            }`}
            style={[
              styles.row,
              on && {
                borderColor: hueOf(ARCHETYPE_SYMBOL[archetype.id]),
                backgroundColor: tint(hueOf(ARCHETYPE_SYMBOL[archetype.id])),
              },
              open && {borderColor: palette.danger},
            ]}>
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: tint(
                      hueOf(ARCHETYPE_SYMBOL[archetype.id]),
                    ),
                  },
                ]}>
                <Symbol name={ARCHETYPE_SYMBOL[archetype.id]} size={20} />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowName,
                    on && {color: hueOf(ARCHETYPE_SYMBOL[archetype.id])},
                  ]}>
                  {archetype.name}
                  {on ? ' · yours' : ''}
                </Text>
                <Text style={styles.rowDetail}>
                  For someone who {archetype.forWhom}.
                </Text>
                <Text style={[styles.means, open && {color: palette.danger}]}>
                  {open
                    ? `Tap again to choose it · ${preview(archetype.id)}`
                    : `${archetype.leadsWith} · ${preview(archetype.id)}`}
                </Text>
              </View>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  caption: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  rowText: {
    flex: 1,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  rowName: {
    ...t.subtitle,
    color: palette.text,
  },
  rowDetail: {
    ...t.caption,
    color: palette.textDim,
  },
  means: {
    ...t.caption,
    color: palette.textMuted,
  },
});
