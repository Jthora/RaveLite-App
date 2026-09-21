/**
 * What you're training for.
 *
 * One question a stranger can answer, in place of twenty they can't. It
 * writes the same fields the other panels write — packs, day shape,
 * tracks — and then gets out of the way: everything it moved is visible
 * below it, and changing one afterwards is an ordinary edit, not a
 * departure from a preset.
 *
 * So picking is deliberately two taps. The first shows what would change
 * and what it costs; the second does it. Nobody should lose a tuned
 * program to a mis-tap on a list.
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
import {loadArchetype} from '../../domain/profile/repository';
import {applyArchetype} from '../../domain/profile/setup';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** "9 chimes · 5 packs · 142 drills · par 20" — what taking it would mean. */
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
    `${rounds} chimes`,
    shape ? shape.name.toLowerCase() : '',
    `${archetype.packs.length} ${
      archetype.packs.length === 1 ? 'pack' : 'packs'
    }`,
    `+${drills} drills`,
    `par ${parFor(densityFor(archetype.shape), DAILY_PAR)}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function ArchetypePanel() {
  const [chosen, setChosen] = useState<ArchetypeId | undefined>(loadArchetype);
  /** Tapped once, showing what it would do. */
  const [asking, setAsking] = useState<ArchetypeId | undefined>();
  const accent = ELEMENTS.heart.accent;

  const press = (id: ArchetypeId) => {
    if (asking !== id) {
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
        A starting point, not a setting. Taking one fills in the packs, the day
        and the tracks below — all of which you can then change.
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
              open ? ' Tap again to take it.' : ''
            }`}
            style={[
              styles.row,
              on && {borderColor: accent, backgroundColor: `${accent}14`},
              open && {borderColor: palette.danger},
            ]}>
            <View style={styles.rowText}>
              <Text style={[styles.rowName, on && {color: accent}]}>
                {archetype.name}
                {on ? ' · yours' : ''}
              </Text>
              <Text style={styles.rowDetail}>
                For someone who {archetype.forWhom}.
              </Text>
              <Text style={[styles.means, open && {color: palette.danger}]}>
                {open
                  ? `Tap again to take it — ${preview(archetype.id)}`
                  : `${archetype.leadsWith} · ${preview(archetype.id)}`}
              </Text>
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
  rowText: {
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
