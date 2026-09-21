/**
 * What you have to train with, and how loud you can be.
 *
 * Each tile says what claiming it would unlock, because "15 drills and
 * the Pull track" teaches the idea faster than any paragraph: the
 * program is built from what the room can actually do.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  KIT_ITEMS,
  KIT_LABELS,
  unlockCount,
  usableDrills,
  type KitItem,
  type Noise,
} from '../../domain/profile/kit';
import {loadFacts, setFacts} from '../../domain/profile/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const NOISE: readonly {id: Noise; name: string; detail: string}[] = [
  {
    id: 'quiet',
    name: 'Quiet flat',
    detail: 'No jumping, skipping or staff — nothing the floor below hears.',
  },
  {id: 'normal', name: 'Normal', detail: 'Anything but the loudest work.'},
  {
    id: 'free',
    name: 'Free',
    detail: 'Jump, skip and spin a staff as you like.',
  },
];

export function KitPanel() {
  const [facts, setLocal] = useState(loadFacts);
  const accent = ELEMENTS.heart.accent;
  const usable = usableDrills(facts).length;

  const toggle = (item: KitItem) => {
    if (item === 'floor') {
      return; // everyone has somewhere to stand
    }
    const kit = facts.kit.includes(item)
      ? facts.kit.filter(k => k !== item)
      : [...facts.kit, item];
    const next = {...facts, kit};
    setFacts(next);
    setLocal(next);
  };

  const setNoise = (noise: Noise) => {
    const next = {...facts, noise};
    setFacts(next);
    setLocal(next);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>WHAT YOU TRAIN WITH</Text>
      <Text style={styles.caption}>
        {usable} drills fit this kit. Everything the app asks for comes from
        here.
      </Text>
      <View style={styles.tiles}>
        {KIT_ITEMS.map(item => {
          const has = facts.kit.includes(item);
          const unlocks = unlockCount(item, facts);
          return (
            <Tap
              key={item}
              testID={`kit-${item}`}
              variant="plain"
              onPress={() => toggle(item)}
              disabled={item === 'floor'}
              accessibilityRole="button"
              accessibilityState={{selected: has}}
              accessibilityLabel={`${KIT_LABELS[item]}${
                has ? ', you have this' : `, would unlock ${unlocks} drills`
              }`}
              style={[
                styles.tile,
                has && {borderColor: accent, backgroundColor: `${accent}14`},
              ]}>
              <View>
                <Text style={[styles.tileName, has && {color: accent}]}>
                  {KIT_LABELS[item]}
                </Text>
                <Text style={styles.tileNote}>
                  {item === 'floor'
                    ? 'Always'
                    : has
                    ? 'Yours'
                    : unlocks > 0
                    ? `+${unlocks} drills`
                    : 'Nothing new yet'}
                </Text>
              </View>
            </Tap>
          );
        })}
      </View>

      <Text style={styles.eyebrow}>HOW LOUD YOU CAN BE</Text>
      <View style={styles.pills}>
        {NOISE.map(option => {
          const on = facts.noise === option.id;
          return (
            <Tap
              key={option.id}
              testID={`noise-${option.id}`}
              variant={on ? 'solid' : 'ghost'}
              color={on ? accent : palette.textDim}
              onPress={() => setNoise(option.id)}
              accessibilityRole="button"
              accessibilityState={{selected: on}}
              style={styles.pill}>
              <Text style={[styles.pillText, on && styles.pillOn]}>
                {option.name}
              </Text>
            </Tap>
          );
        })}
      </View>
      <Text style={styles.caption}>
        {NOISE.find(n => n.id === facts.noise)?.detail}
      </Text>
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
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  tileName: {
    ...t.body,
    color: palette.text,
  },
  tileNote: {
    ...t.caption,
    color: palette.textMuted,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    ...t.caption,
    color: palette.textDim,
  },
  pillOn: {
    color: palette.bg,
    fontWeight: '700',
  },
});
