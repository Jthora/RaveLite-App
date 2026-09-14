/**
 * WindowEditor — Layer 2 editor for one Window.
 *
 * Composes the label field, TimeRangeSlider, DayToggle, and a slot
 * list. Tapping a slot opens the SlotEditor (Layer 3) inline within
 * this same panel — single takeover, no nested navigators.
 *
 * State:
 *   draft           — local Window being edited
 *   editingSlot     — null | {index} | {index: 'new'} → drives Layer 3
 */
import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

import {DayToggle} from './DayToggle';
import {SlotEditor} from './SlotEditor';
import {TimeRangeSlider} from './TimeRangeSlider';
import {Tap} from '../Tap';

import {makeSlot} from '../../domain/reminders/planMutations';
import type {CadenceSlot, Window} from '../../domain/reminders/types';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  window: Window;
  /** True if this is a brand-new window — hides the Delete button. */
  isNew?: boolean;
  onSave: (updated: Window) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

type SlotEditingState =
  | null
  | {kind: 'edit'; index: number}
  | {kind: 'new'; element: ElementId};

export function WindowEditor({window: w, isNew, onSave, onDelete, onCancel}: Props) {
  const [draft, setDraft] = useState<Window>(w);
  const [editing, setEditing] = useState<SlotEditingState>(null);

  // The dominant element drives the accent so every action button
  // matches the strongest element in the window. Falls back to heart.
  const accent = ELEMENTS[dominantElement(draft)].color;
  const accentDim = ELEMENTS[dominantElement(draft)].accent;

  const setLabel = useCallback((label: string) => {
    setDraft(d => ({...d, label}));
  }, []);

  const setRange = useCallback((startTime: string, endTime: string) => {
    setDraft(d => ({...d, startTime, endTime}));
  }, []);

  const setDays = useCallback((daysOfWeek: number[]) => {
    setDraft(d => ({...d, daysOfWeek}));
  }, []);

  const toggleExclusive = useCallback(() => {
    setDraft(d => ({...d, exclusive: !d.exclusive}));
  }, []);

  const onSlotSave = useCallback(
    (updated: CadenceSlot) => {
      setDraft(d => {
        if (!editing) {return d;}
        if (editing.kind === 'new') {
          return {...d, slots: [...d.slots, updated]};
        }
        return {
          ...d,
          slots: d.slots.map((s, i) => (i === editing.index ? updated : s)),
        };
      });
      setEditing(null);
    },
    [editing],
  );

  const onSlotDelete = useCallback(() => {
    setDraft(d => {
      if (!editing || editing.kind !== 'edit') {return d;}
      return {...d, slots: d.slots.filter((_, i) => i !== editing.index)};
    });
    setEditing(null);
  }, [editing]);

  // Layer 3 — SlotEditor takeover.
  if (editing) {
    const slot =
      editing.kind === 'edit' ? draft.slots[editing.index] : makeSlot(editing.element);
    return (
      <SlotEditor
        slot={slot}
        isNew={editing.kind === 'new'}
        onSave={onSlotSave}
        onDelete={editing.kind === 'edit' ? onSlotDelete : undefined}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // Layer 2 — Window form.
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, {color: accentDim}]}>
        ▸  {isNew ? 'NEW WINDOW' : 'EDIT WINDOW'}
      </Text>

      {/* Label */}
      <Section label="Label">
        <TextInput
          value={draft.label}
          onChangeText={setLabel}
          placeholder="Window name"
          placeholderTextColor={palette.textMuted}
          style={[styles.input, {borderColor: palette.border}]}
        />
      </Section>

      {/* Time range */}
      <Section label="Time range">
        <TimeRangeSlider
          start={draft.startTime}
          end={draft.endTime}
          onChange={setRange}
          accent={accent}
        />
      </Section>

      {/* Days */}
      <Section label="Days of week">
        <DayToggle value={draft.daysOfWeek} onChange={setDays} accent={accent} />
      </Section>

      {/* Slots */}
      <Section
        label={`Slots (${draft.slots.length})`}
        right={
          <Tap
            variant="plain"
            color={accentDim}
            onPress={() => setEditing({kind: 'new', element: 'heart'})}>
            <Text style={[styles.toggle, {color: accentDim}]}>+ add</Text>
          </Tap>
        }>
        {draft.slots.map((s, i) => (
          <SlotRow
            key={i}
            slot={s}
            onPress={() => setEditing({kind: 'edit', index: i})}
          />
        ))}
        {draft.slots.length === 0 && (
          <Text style={styles.emptyText}>No slots. Tap + add to schedule one.</Text>
        )}
      </Section>

      {/* Advanced */}
      <Section label="Advanced">
        <Tap
          variant="plain"
          color={accentDim}
          onPress={toggleExclusive}
          style={styles.checkRow}>
          <View
            style={[
              styles.check,
              {
                borderColor: draft.exclusive ? accent : palette.border,
                backgroundColor: draft.exclusive ? accent : 'transparent',
              },
            ]}>
            {draft.exclusive && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.checkLabel}>Exclusive window</Text>
            <Text style={styles.checkHelp}>
              Suppresses any other window's pulses while this one is active.
            </Text>
          </View>
        </Tap>
      </Section>

      {/* Footer */}
      <View style={styles.footer}>
        {onDelete && !isNew && (
          <Tap
            variant="ghost"
            color={palette.danger}
            onPress={onDelete}
            style={styles.footerBtn}>
            <Text style={[styles.footerText, {color: palette.danger}]}>Delete</Text>
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
          <Text style={[styles.footerText, {color: palette.bg, fontWeight: '700'}]}>
            Save
          </Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

interface SlotRowProps {
  slot: CadenceSlot;
  onPress: () => void;
}
function SlotRow({slot, onPress}: SlotRowProps) {
  const c = ELEMENTS[slot.element].color;
  return (
    <Tap
      variant="plain"
      color={c}
      onPress={onPress}
      style={[styles.slotRow, {borderColor: palette.border}]}>
      <View style={[styles.slotDot, {backgroundColor: c}]} />
      <Text style={styles.slotLabel}>{ELEMENTS[slot.element].label}</Text>
      <Text style={styles.slotMeta}>
        every {slot.everyMinutes}m
        {slot.maxSeconds ? ` · ≤${slot.maxSeconds}s` : ''}
        {slot.requiredTags?.length ? ` · ${slot.requiredTags.length} tag` : ''}
      </Text>
      <Text style={[styles.chevron, {color: c}]}>›</Text>
    </Tap>
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
        <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function dominantElement(w: Window): ElementId {
  if (w.slots.length === 0) {return 'heart';}
  const counts: Partial<Record<ElementId, number>> = {};
  for (const s of w.slots) {counts[s.element] = (counts[s.element] ?? 0) + 1;}
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
  section: {
    marginTop: spacing.lg,
  },
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
  slotRow: {
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
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    minWidth: 56,
  },
  slotMeta: {
    flex: 1,
    color: palette.textDim,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkMark: {
    color: palette.bg,
    fontWeight: '700',
    fontSize: 13,
  },
  checkLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  checkHelp: {
    color: palette.textDim,
    fontSize: 12,
    marginTop: 2,
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
