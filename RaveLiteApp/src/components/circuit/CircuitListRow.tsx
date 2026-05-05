/**
 * CircuitListRow — one collapsed row in the Circuits overview.
 * Element-tinted dot from the dominant leg · name · meta (legs · total time).
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import type {CustomCircuit} from '../../domain/circuit/customTypes';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  circuit: CustomCircuit;
  onPress?: () => void;
}

export function CircuitListRow({circuit: c, onPress}: Props) {
  const dom = dominantElement(c.legs.map(l => l.element));
  const accent = ELEMENTS[dom].color;
  const total = c.legs.reduce((s, l) => s + l.durationSec, 0);

  return (
    <Tap
      variant="plain"
      color={accent}
      onPress={onPress}
      style={[styles.row, {borderColor: palette.border}]}>
      <View style={[styles.dot, {backgroundColor: accent}]} />
      <View style={styles.body}>
        <Text style={styles.label}>{c.name || 'Unnamed circuit'}</Text>
        <Text style={styles.meta}>
          {c.legs.length} leg{c.legs.length === 1 ? '' : 's'}  ·  {fmtTotal(total)}
        </Text>
      </View>
      <Text style={[styles.chevron, {color: accent}]}>›</Text>
    </Tap>
  );
}

function dominantElement(els: ElementId[]): ElementId {
  if (els.length === 0) {return 'heart';}
  const counts: Partial<Record<ElementId, number>> = {};
  for (const e of els) {counts[e] = (counts[e] ?? 0) + 1;}
  let best: ElementId = 'heart';
  let bestN = -1;
  for (const id of Object.keys(counts) as ElementId[]) {
    const n = counts[id]!;
    if (n > bestN || (n === bestN && id === 'heart')) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

function fmtTotal(sec: number): string {
  if (sec === 0) {return '—';}
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) {return `${s}s`;}
  if (s === 0) {return `${m}m`;}
  return `${m}m ${s}s`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.surface,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {flex: 1},
  label: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  meta: {
    color: palette.textDim,
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    paddingHorizontal: spacing.xs,
  },
});
