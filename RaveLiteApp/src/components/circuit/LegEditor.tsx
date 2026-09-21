/**
 * LegEditor — Layer 3 leaf editor for one CustomCircuitLeg.
 *
 *   ┌─ Element row    (5 pills)
 *   ├─ Drill picker   (filtered exercises for the chosen element)
 *   ├─ Duration       (preset chips + readable label)
 *   └─ Footer         [Delete] [Cancel] [Save]
 *
 * When the element changes and the current exerciseId no longer
 * belongs to that element, the picker auto-selects the first drill
 * for the new element so the leg stays consistent.
 */
import React, {useCallback, useState, useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {exercisesForElement} from '../../domain/circuit/legsFromCustomCircuit';
import {
  LEG_DURATION_DEFAULT,
  type CustomCircuitLeg,
} from '../../domain/circuit/customTypes';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  leg: CustomCircuitLeg;
  isNew?: boolean;
  onSave: (updated: CustomCircuitLeg) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const DURATION_PRESETS = [15, 25, 30, 45, 60, 90, 120];

export function LegEditor({leg, isNew, onSave, onDelete, onCancel}: Props) {
  const [draft, setDraft] = useState<CustomCircuitLeg>(leg);
  const accent = ELEMENTS[draft.element].color;
  const accentDim = ELEMENTS[draft.element].accent;

  const drills = useMemo(
    () => exercisesForElement(draft.element),
    [draft.element],
  );

  const setElement = useCallback((next: ElementId) => {
    setDraft(d => {
      if (d.element === next) {
        return d;
      }
      const list = exercisesForElement(next);
      const stillValid = list.some(e => e.id === d.exerciseId);
      return {
        ...d,
        element: next,
        exerciseId: stillValid ? d.exerciseId : list[0]?.id ?? d.exerciseId,
      };
    });
  }, []);

  const setExercise = useCallback((id: string) => {
    setDraft(d => ({...d, exerciseId: id}));
  }, []);

  const setDuration = useCallback((sec: number) => {
    setDraft(d => ({...d, durationSec: sec}));
  }, []);

  const summary = `${ELEMENTS[draft.element].name} · ${draft.durationSec}s`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, {color: accentDim}]}>
        ▸ {isNew ? 'NEW LEG' : 'EDIT LEG'}
      </Text>
      <Text style={styles.summary}>{summary}</Text>

      {/* Element */}
      <Section label="Element">
        <View style={styles.row}>
          {ELEMENT_ORDER.map(id => {
            const active = draft.element === id;
            const c = ELEMENTS[id].color;
            return (
              <Tap
                key={id}
                variant="pill"
                color={active ? c : palette.border}
                onPress={() => setElement(id)}
                style={[
                  styles.elPill,
                  active && {backgroundColor: c, borderColor: c},
                ]}>
                <Text
                  style={[
                    styles.elPillText,
                    {color: active ? palette.bg : palette.textDim},
                  ]}>
                  {ELEMENTS[id].glyph} {ELEMENTS[id].name}
                </Text>
              </Tap>
            );
          })}
        </View>
      </Section>

      {/* Drill */}
      <Section label="Drill">
        <View style={styles.drillList}>
          {drills.map(ex => {
            const active = draft.exerciseId === ex.id;
            return (
              <Tap
                key={ex.id}
                variant="plain"
                color={accent}
                onPress={() => setExercise(ex.id)}
                style={[
                  styles.drillRow,
                  {
                    borderColor: active ? accent : palette.border,
                    backgroundColor: active
                      ? withAlpha(accent, 0.08)
                      : palette.surface,
                  },
                ]}>
                <View style={styles.drillBody}>
                  <Text style={styles.drillName}>{ex.name}</Text>
                  <Text style={styles.drillMeta}>
                    {ex.dose} · ~{ex.approxSeconds}s
                  </Text>
                </View>
                {active && (
                  <Text style={[styles.drillCheck, {color: accent}]}>●</Text>
                )}
              </Tap>
            );
          })}
          {drills.length === 0 && (
            <Text style={styles.emptyText}>
              No drills available for this element.
            </Text>
          )}
        </View>
      </Section>

      {/* Duration */}
      <Section label="Duration">
        <View style={styles.row}>
          {DURATION_PRESETS.map(sec => {
            const active = draft.durationSec === sec;
            return (
              <Tap
                key={sec}
                variant="pill"
                color={active ? accent : palette.border}
                onPress={() => setDuration(sec)}
                style={[
                  styles.chip,
                  active && {backgroundColor: accent, borderColor: accent},
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: active ? palette.bg : palette.text},
                  ]}>
                  {sec}s
                </Text>
              </Tap>
            );
          })}
        </View>
      </Section>

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

void LEG_DURATION_DEFAULT;

interface SectionProps {
  label: string;
  children?: React.ReactNode;
}
function Section({label, children}: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.replace(/^#/, ''));
  if (!m) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
  },
  summary: {
    ...t.subtitle,
    color: palette.text,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  section: {marginTop: spacing.lg},
  sectionLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  elPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.surface,
  },
  elPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.surface,
    minWidth: 48,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  drillList: {
    gap: spacing.xs,
  },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  drillBody: {flex: 1},
  drillName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  drillMeta: {
    color: palette.textDim,
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  drillCheck: {
    fontSize: 14,
  },
  emptyText: {
    color: palette.textDim,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
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
