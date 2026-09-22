/**
 * What you are here to learn.
 *
 * Packs are the coarsest of the four dials: the room decides what is
 * possible, the day shape sizes it, a mode overrides it for a while, and
 * a pack decides whether a whole curriculum is part of your app at all.
 *
 * Turning them all off is allowed, and leaves a complete program — push,
 * pull, squat, hinge, breath, posture, stillness, mobility. That is the
 * promise this screen has to keep, so it says so rather than hiding an
 * empty state behind a warning.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {PACKS, drillsOf, type PackId} from '../../domain/profile/packs';
import {loadPacks, setPacks} from '../../domain/profile/repository';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {palette, radius, spacing, type as t} from '../../theme';

/** Each curriculum has a colour and a picture, used wherever it appears. */
export const PACK_SYMBOL: Record<PackId, SymbolName> = {
  dance: 'dance',
  'dance-combat': 'danceCombat',
  martial: 'martial',
  staff: 'staff',
  'yoga-taichi': 'yoga',
  jumps: 'jumps',
  runs: 'running',
  'military-tests': 'militaryTests',
};

export function PacksPanel() {
  const [packs, setLocal] = useState<PackId[]>(loadPacks);

  const toggle = (id: PackId) => {
    const next = packs.includes(id)
      ? packs.filter(p => p !== id)
      : [...packs, id];
    setPacks(next);
    setLocal(next);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>WHAT YOU'RE HERE TO LEARN</Text>
      <Text style={styles.caption}>
        {packs.length === 0
          ? 'None on. You still get the whole base program — push, pull, squat, hinge, breath, posture, stillness, mobility.'
          : 'On top of the base program, which you get either way.'}
      </Text>
      {PACKS.map(pack => {
        const on = packs.includes(pack.id);
        const count = drillsOf(pack).length;
        return (
          <Tap
            key={pack.id}
            testID={`pack-${pack.id}`}
            variant="plain"
            onPress={() => toggle(pack.id)}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            accessibilityLabel={`${pack.name}${
              on ? ', on' : `, would add ${count} drills`
            }. ${pack.detail}`}
            style={[
              styles.row,
              on && {
                borderColor: hueOf(PACK_SYMBOL[pack.id]),
                backgroundColor: tint(hueOf(PACK_SYMBOL[pack.id])),
              },
            ]}>
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: tint(hueOf(PACK_SYMBOL[pack.id]))},
                ]}>
                <Symbol name={PACK_SYMBOL[pack.id]} size={20} />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowName,
                    on && {color: hueOf(PACK_SYMBOL[pack.id])},
                  ]}>
                  {pack.name}
                </Text>
                <Text style={styles.rowDetail}>{pack.detail}</Text>
              </View>
              <Text
                style={[
                  styles.means,
                  on && {color: hueOf(PACK_SYMBOL[pack.id])},
                ]}>
                {on ? `${count}` : `+${count}`}
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
    minHeight: 60,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  rowText: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    ...t.subtitle,
    color: palette.text,
  },
  rowDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  means: {
    ...t.caption,
    color: palette.textMuted,
  },
});
