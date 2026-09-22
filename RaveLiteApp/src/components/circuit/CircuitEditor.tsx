/**
 * CircuitEditor — Layer 2 editor for one CustomCircuit.
 *
 * Composes a name input, an ordered leg list, and an action footer.
 * Leg edits open the LegEditor inline (Layer 3 takeover).
 *
 * Engage runs the circuit immediately via the parent's onEngage —
 * does NOT auto-save. Save commits the draft to storage and returns
 * the persisted circuit. Cancel discards local edits.
 */
import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

import {LegEditor} from './LegEditor';
import {Tap} from '../Tap';
import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import {
  LEG_DURATION_DEFAULT,
  type CustomCircuit,
  type CustomCircuitLeg,
} from '../../domain/circuit/customTypes';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {useBackHandler} from '../BackStack';

interface Props {
  circuit: CustomCircuit;
  isNew?: boolean;
  onSave: (updated: CustomCircuit) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onEngage: (draft: CustomCircuit) => void;
}

type LegEditingState = null | {kind: 'edit'; index: number} | {kind: 'new'};

export function CircuitEditor({
  circuit,
  isNew,
  onSave,
  onDelete,
  onCancel,
  onEngage,
}: Props) {
  const [draft, setDraft] = useState<CustomCircuit>(circuit);
  const [editing, setEditing] = useState<LegEditingState>(null);
  // Back in a leg closes the leg, not the circuit.
  useBackHandler(editing !== null, () => setEditing(null));

  // Accent: dominant element of current legs, fallback heart.
  const dom = dominantElement(draft.legs.map(l => l.element));
  const accent = ELEMENTS[dom].color;
  const accentDim = ELEMENTS[dom].accent;

  const setName = useCallback((name: string) => {
    setDraft(d => ({...d, name}));
  }, []);

  const onLegSave = useCallback(
    (updated: CustomCircuitLeg) => {
      setDraft(d => {
        if (!editing) {
          return d;
        }
        if (editing.kind === 'new') {
          return {...d, legs: [...d.legs, updated]};
        }
        return {
          ...d,
          legs: d.legs.map((l, i) => (i === editing.index ? updated : l)),
        };
      });
      setEditing(null);
    },
    [editing],
  );

  const onLegDelete = useCallback(() => {
    setDraft(d => {
      if (!editing || editing.kind !== 'edit') {
        return d;
      }
      return {...d, legs: d.legs.filter((_, i) => i !== editing.index)};
    });
    setEditing(null);
  }, [editing]);

  const onAddLeg = useCallback(() => {
    setEditing({kind: 'new'});
  }, []);

  // Layer 3 takeover.
  if (editing) {
    const leg: CustomCircuitLeg =
      editing.kind === 'edit' ? draft.legs[editing.index] : makeBlankLeg();
    return (
      <LegEditor
        leg={leg}
        isNew={editing.kind === 'new'}
        onSave={onLegSave}
        onDelete={editing.kind === 'edit' ? onLegDelete : undefined}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const total = draft.legs.reduce((s, l) => s + l.durationSec, 0);
  const canEngage = draft.legs.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text
        accessibilityRole="header"
        style={[styles.eyebrow, {color: accentDim}]}>
        ▸ {isNew ? 'NEW CIRCUIT' : 'EDIT CIRCUIT'}
      </Text>

      {/* Name */}
      <Section label="Name">
        <TextInput
          value={draft.name}
          onChangeText={setName}
          placeholder="Circuit name"
          placeholderTextColor={palette.textFaint}
          style={[styles.input, {borderColor: palette.border}]}
        />
      </Section>

      {/* Legs */}
      <Section
        label={`Legs (${draft.legs.length}) · ${fmtTotal(total)}`}
        right={
          <Tap variant="plain" color={accentDim} onPress={onAddLeg}>
            <Text style={[styles.toggle, {color: accentDim}]}>+ add leg</Text>
          </Tap>
        }>
        {draft.legs.map((l, i) => (
          <LegRow
            key={i}
            index={i}
            leg={l}
            onPress={() => setEditing({kind: 'edit', index: i})}
          />
        ))}
        {draft.legs.length === 0 && (
          <Text style={styles.emptyText}>
            No legs yet. Tap + add leg to add one.
          </Text>
        )}
      </Section>

      {/* Engage */}
      <View style={styles.engageRow}>
        <Tap
          variant="solid"
          color={canEngage ? accent : palette.textMuted}
          disabled={!canEngage}
          onPress={() => onEngage(draft)}
          style={styles.engageBtn}>
          <Text style={styles.engageText}>Start circuit ⟶</Text>
        </Tap>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {onDelete && !isNew && (
          <Tap
            variant="ghost"
            color={palette.danger}
            onPress={onDelete}
            style={styles.footerBtn}>
            <Text style={[styles.footerText, {color: palette.danger}]}>
              Delete
            </Text>
          </Tap>
        )}
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={onCancel}
          style={styles.footerBtn}>
          <Text style={[styles.footerText, {color: palette.text}]}>Cancel</Text>
        </Tap>
        <Tap
          variant="solid"
          color={accent}
          onPress={() => onSave(draft)}
          style={styles.footerBtn}>
          <Text
            style={[styles.footerText, {color: palette.bg, fontWeight: '700'}]}>
            Save
          </Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

interface SectionProps {
  label: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}
function Section({label, right, children}: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={styles.sectionLabel}>
          {label.toUpperCase()}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

interface LegRowProps {
  index: number;
  leg: CustomCircuitLeg;
  onPress: () => void;
}
function LegRow({index, leg, onPress}: LegRowProps) {
  const c = ELEMENTS[leg.element].color;
  const ex = EXERCISE_LIBRARY.find(e => e.id === leg.exerciseId);
  return (
    <Tap
      variant="plain"
      color={c}
      onPress={onPress}
      style={[styles.legRow, {borderColor: palette.border}]}>
      <Text style={[styles.legIndex, {color: palette.textFaint}]}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      <View style={[styles.legDot, {backgroundColor: c}]} />
      <View style={styles.legBody}>
        <Text style={styles.legName}>{ex?.name ?? leg.exerciseId}</Text>
        <Text style={styles.legMeta}>
          {ELEMENTS[leg.element].name} · {leg.durationSec}s
        </Text>
      </View>
      <Text style={[styles.chevron, {color: c}]}>›</Text>
    </Tap>
  );
}

function makeBlankLeg(): CustomCircuitLeg {
  // Default to first air drill — neutral starting point.
  const first =
    EXERCISE_LIBRARY.find(e => e.element === 'air') ?? EXERCISE_LIBRARY[0];
  return {
    element: first.element,
    exerciseId: first.id,
    durationSec: LEG_DURATION_DEFAULT,
  };
}

function dominantElement(els: ElementId[]): ElementId {
  if (els.length === 0) {
    return 'heart';
  }
  const counts: Partial<Record<ElementId, number>> = {};
  for (const e of els) {
    counts[e] = (counts[e] ?? 0) + 1;
  }
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
  if (sec === 0) {
    return '0s';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) {
    return `${s}s`;
  }
  if (s === 0) {
    return `${m}m`;
  }
  return `${m}m ${s}s`;
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  section: {marginTop: spacing.lg},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  toggle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    color: palette.text,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.surface,
    marginBottom: spacing.xs,
  },
  legIndex: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 20,
  },
  legDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legBody: {flex: 1},
  legName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  legMeta: {
    color: palette.textDim,
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  engageRow: {
    marginTop: spacing.lg,
  },
  engageBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  engageText: {
    color: palette.bg,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    letterSpacing: 0.6,
  },
});
