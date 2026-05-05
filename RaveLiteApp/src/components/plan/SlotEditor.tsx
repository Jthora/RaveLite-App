/**
 * SlotEditor — Layer 3 leaf editor for one CadenceSlot.
 *
 * Self-contained: receives a slot, edits a local draft, returns the
 * updated slot via onSave. Parent (WindowEditor → PlanPanel) is
 * responsible for splicing the result back into the plan.
 *
 * Layout:
 *   ┌─ Element row  (5 pills, one is active)
 *   ├─ Cadence     (preset chips for everyMinutes)
 *   ├─ Max length  (preset chips for maxSeconds + "free")
 *   ├─ Filter tags (expandable; toggle pills for Target values)
 *   └─ Footer      [Delete] [Cancel] [Save]
 */
import React, {useState, useCallback, useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import type {CadenceSlot} from '../../domain/reminders/types';
import type {Target} from '../../domain/exercises/types';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  slot: CadenceSlot;
  /** True when this slot is being added (not editing existing) — hides Delete. */
  isNew?: boolean;
  onSave: (updated: CadenceSlot) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const EVERY_MIN_PRESETS = [15, 30, 45, 60, 90, 120, 180];
/** null = "free" (no maxSeconds cap). */
const MAX_SEC_PRESETS: Array<number | null> = [60, 90, 120, 180, null];

/** All Target values from exercises domain. Kept inline so this file
 *  stays self-contained — the source-of-truth Target union is type-only. */
const ALL_TAGS: Target[] = [
  'UCS', 'Hourglass', 'APT',
  'PFT-Pushups', 'PFT-Situps', 'PFT-Run',
  'Mobility', 'Strength', 'Coordination',
  'Flow', 'Breath', 'Presence',
  'NoFloor',
];

export function SlotEditor({slot, isNew, onSave, onDelete, onCancel}: Props) {
  const [draft, setDraft] = useState<CadenceSlot>(slot);
  const [tagsExpanded, setTagsExpanded] = useState(
    (slot.requiredTags?.length ?? 0) > 0,
  );

  const accent = ELEMENTS[draft.element].color;
  const accentDim = ELEMENTS[draft.element].accent;

  const setElement = useCallback((next: ElementId) => {
    setDraft(d => ({...d, element: next}));
  }, []);

  const setEvery = useCallback((mins: number) => {
    setDraft(d => ({...d, everyMinutes: mins}));
  }, []);

  const setMax = useCallback((sec: number | null) => {
    setDraft(d => {
      const {maxSeconds: _drop, ...rest} = d;
      void _drop;
      return sec === null ? rest : {...rest, maxSeconds: sec};
    });
  }, []);

  const toggleTag = useCallback((tag: Target) => {
    setDraft(d => {
      const cur = new Set(d.requiredTags ?? []);
      if (cur.has(tag)) {cur.delete(tag);} else {cur.add(tag);}
      const next = Array.from(cur) as CadenceSlot['requiredTags'];
      if (!next || next.length === 0) {
        const {requiredTags: _drop, ...rest} = d;
        void _drop;
        return rest;
      }
      return {...d, requiredTags: next};
    });
  }, []);

  const tagsCount = draft.requiredTags?.length ?? 0;

  const summary = useMemo(
    () =>
      `Every ${draft.everyMinutes}m · ${
        draft.maxSeconds ? `≤${draft.maxSeconds}s` : 'free length'
      }${tagsCount > 0 ? ` · ${tagsCount} tag${tagsCount === 1 ? '' : 's'}` : ''}`,
    [draft.everyMinutes, draft.maxSeconds, tagsCount],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={[styles.eyebrow, {color: accentDim}]}>
        ⏵  {isNew ? 'NEW SLOT' : 'EDIT SLOT'}
      </Text>
      <Text style={styles.summary}>{summary}</Text>

      {/* Element row */}
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
                  {ELEMENTS[id].glyph}  {ELEMENTS[id].label}
                </Text>
              </Tap>
            );
          })}
        </View>
      </Section>

      {/* Every N minutes */}
      <Section label="Cadence">
        <View style={styles.row}>
          {EVERY_MIN_PRESETS.map(m => {
            const active = draft.everyMinutes === m;
            return (
              <Tap
                key={m}
                variant="pill"
                color={active ? accent : palette.border}
                onPress={() => setEvery(m)}
                style={[
                  styles.chip,
                  active && {backgroundColor: accent, borderColor: accent},
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: active ? palette.bg : palette.text},
                  ]}>
                  {m}m
                </Text>
              </Tap>
            );
          })}
        </View>
      </Section>

      {/* Max seconds */}
      <Section label="Max length">
        <View style={styles.row}>
          {MAX_SEC_PRESETS.map(sec => {
            const active = (draft.maxSeconds ?? null) === sec;
            const label = sec === null ? 'free' : `${sec}s`;
            return (
              <Tap
                key={label}
                variant="pill"
                color={active ? accent : palette.border}
                onPress={() => setMax(sec)}
                style={[
                  styles.chip,
                  active && {backgroundColor: accent, borderColor: accent},
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {color: active ? palette.bg : palette.text},
                  ]}>
                  {label}
                </Text>
              </Tap>
            );
          })}
        </View>
      </Section>

      {/* Required tags (collapsible) */}
      <Section
        label="Filter by tags"
        right={
          <Tap
            variant="plain"
            color={accentDim}
            onPress={() => setTagsExpanded(v => !v)}>
            <Text style={[styles.toggle, {color: accentDim}]}>
              {tagsExpanded ? 'hide' : tagsCount > 0 ? `${tagsCount} active` : 'add'}
            </Text>
          </Tap>
        }>
        {tagsExpanded && (
          <View style={styles.row}>
            {ALL_TAGS.map(tag => {
              const active = draft.requiredTags?.includes(tag) ?? false;
              return (
                <Tap
                  key={tag}
                  variant="pill"
                  color={active ? accent : palette.border}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.chip,
                    active && {backgroundColor: accent, borderColor: accent},
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      {color: active ? palette.bg : palette.textDim, fontSize: 11},
                    ]}>
                    {tag}
                  </Text>
                </Tap>
              );
            })}
          </View>
        )}
        {tagsExpanded && (
          <Text style={styles.helper}>
            Slot only fires when the chosen exercise carries every selected tag.
          </Text>
        )}
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
    minWidth: 44,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  helper: {
    color: palette.textDim,
    fontSize: 11,
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
