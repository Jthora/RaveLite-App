/**
 * PlanPanel — Heart > Plan tab body.
 *
 * Layer 1: read-only overview of the active Plan with a 24h ribbon,
 * window list, Apply / Revert / Add window action row.
 * Layer 2: WindowEditor takeover when editingWindowId is set.
 *   (Layer 3 SlotEditor is owned by WindowEditor itself.)
 *
 * State model:
 *   committed         — last-saved plan, source of truth in storage
 *   draft             — in-progress edits; plansEqual vs committed = dirty
 *   editingWindowId   — null = overview, string = which window is open
 *   newlyAddedId      — when set, the editor treats the window as "new"
 *                       so cancel discards it instead of orphaning a
 *                       blank window in the draft list.
 */
import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {PlanRibbon} from '../../components/plan/PlanRibbon';
import {WindowEditor} from '../../components/plan/WindowEditor';
import {WindowRow} from '../../components/plan/WindowRow';
import {Tap} from '../../components/Tap';

import {loadPlan, savePlan, resetPlanToDefault} from '../../domain/reminders/repository';
import {
  addWindow,
  findWindow,
  makeWindow,
  plansEqual,
  removeWindow,
  totalSlotCount,
  updateWindow,
} from '../../domain/reminders/planMutations';
import type {Plan, Window} from '../../domain/reminders/types';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  /** Hands the saved plan back up to HeartScreen so it can call
   *  notifeeScheduler.applyPlan() — keeps native side effects out of
   *  this purely-presentational panel. */
  onPlanCommitted: (plan: Plan) => void;
}

export function PlanPanel({onPlanCommitted}: Props) {
  const [committed, setCommitted] = useState<Plan>(() => loadPlan());
  const [draft, setDraft] = useState<Plan>(committed);
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const dirty = !plansEqual(draft, committed);
  const accent = ELEMENTS.heart.color;
  const accentDim = ELEMENTS.heart.accent;

  const onApply = useCallback(() => {
    savePlan(draft);
    setCommitted(draft);
    onPlanCommitted(draft);
  }, [draft, onPlanCommitted]);

  const onRevert = useCallback(() => {
    setDraft(committed);
    setEditingWindowId(null);
    setNewlyAddedId(null);
  }, [committed]);

  const onResetDefaults = useCallback(() => {
    const fresh = resetPlanToDefault();
    setCommitted(fresh);
    setDraft(fresh);
    setEditingWindowId(null);
    setNewlyAddedId(null);
  }, []);

  const onAddWindow = useCallback(() => {
    const fresh = makeWindow();
    setDraft(d => addWindow(d, fresh));
    setNewlyAddedId(fresh.id);
    setEditingWindowId(fresh.id);
  }, []);

  const onWindowSave = useCallback((updated: Window) => {
    setDraft(d => updateWindow(d, updated.id, updated));
    setEditingWindowId(null);
    setNewlyAddedId(null);
  }, []);

  const onWindowDelete = useCallback(() => {
    if (!editingWindowId) {return;}
    setDraft(d => removeWindow(d, editingWindowId));
    setEditingWindowId(null);
    setNewlyAddedId(null);
  }, [editingWindowId]);

  const onWindowCancel = useCallback(() => {
    // If the user added a fresh window then cancelled, drop it from
    // the draft so the overview list doesn't gain a blank entry.
    if (newlyAddedId) {
      setDraft(d => removeWindow(d, newlyAddedId));
    }
    setEditingWindowId(null);
    setNewlyAddedId(null);
  }, [newlyAddedId]);

  // Layer 2 — Window editor takeover.
  if (editingWindowId) {
    const w = findWindow(draft, editingWindowId);
    if (w) {
      return (
        <WindowEditor
          window={w}
          isNew={newlyAddedId === editingWindowId}
          onSave={onWindowSave}
          onDelete={onWindowDelete}
          onCancel={onWindowCancel}
        />
      );
    }
    // Window vanished (e.g. deleted out from under us) — fall through
    // to the overview rather than rendering an empty editor.
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.eyebrow, {color: accentDim}]}>
          ⏵  PLAN · {draft.name.toUpperCase()}
        </Text>
        <Text style={styles.subtitle}>
          {draft.windows.length} window{draft.windows.length === 1 ? '' : 's'}  ·  {totalSlotCount(draft)} slot
          {totalSlotCount(draft) === 1 ? '' : 's'} / day
        </Text>
      </View>

      {/* 24h coverage ribbon */}
      <PlanRibbon plan={draft} />

      {/* Window list */}
      <View style={styles.list}>
        {draft.windows.map(w => (
          <WindowRow
            key={w.id}
            window={w}
            onPress={() => setEditingWindowId(w.id)}
          />
        ))}
        {draft.windows.length === 0 && (
          <Text style={styles.emptyText}>
            No windows. Tap + Add window below.
          </Text>
        )}
      </View>

      {/* Add / Revert row */}
      <View style={styles.utilRow}>
        <Tap
          variant="ghost"
          color={accentDim}
          onPress={onAddWindow}
          style={styles.utilBtn}>
          <Text style={[styles.utilBtnText, {color: accentDim}]}>+ Add window</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={onRevert}
          disabled={!dirty}
          style={styles.utilBtn}>
          <Text style={[styles.utilBtnText, {color: dirty ? palette.text : palette.textMuted}]}>
            Revert
          </Text>
        </Tap>
      </View>

      {/* Apply Plan — primary commit */}
      <View style={styles.applyRow}>
        <Tap
          variant="solid"
          color={dirty ? accent : palette.textMuted}
          onPress={onApply}
          disabled={!dirty}
          style={styles.applyBtn}>
          <Text style={styles.applyText}>
            {dirty ? 'Apply Plan' : 'Plan armed'}
          </Text>
        </Tap>
      </View>

      {/* Footer — destructive reset */}
      <Tap
        variant="plain"
        color={palette.danger}
        onPress={onResetDefaults}
        style={styles.dangerRow}>
        <Text style={styles.dangerText}>Reset to factory defaults</Text>
      </Tap>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    ...t.subtitle,
    color: palette.textDim,
  },
  list: {
    marginTop: spacing.sm,
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  utilRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  utilBtn: {
    flex: 1,
    borderRadius: radius.md,
  },
  utilBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  applyRow: {
    marginTop: spacing.lg,
  },
  applyBtn: {
    borderRadius: radius.md,
  },
  applyText: {
    color: palette.bg,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  dangerRow: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerText: {
    color: palette.danger,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
