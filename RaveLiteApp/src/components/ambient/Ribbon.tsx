/**
 * `<Ribbon />` — the single ordered list view of the Always-On
 * surface. Renders a `RibbonRow[]` (from `buildRibbonRows`) as a
 * vertically-stacked, scrollless flex list with a now-line marker.
 *
 * Design constraints (per Always-On Ribbon plan):
 *   - No ScrollView. Rows must fit the viewport. We slice the input
 *     to a visible window centered on the now-row.
 *   - No SVG, no absolute positioning. Pure flexbox.
 *   - Past rows shrink to a thin band; the now-row owns the most
 *     real-estate; future rows are intermediate.
 *   - One row per kind has a deterministic visual treatment
 *     (sealed = filled glyph, skipped = strike, ignored = ghost,
 *     absorbed = dashed, future = outline, now-active = filled hero).
 */
import React, {useMemo, useState} from 'react';
import {Animated, StyleSheet, Text, View, Pressable} from 'react-native';

import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import type {RibbonRow, RibbonRowKind} from '../../domain/ambient/ribbon';
import {formatSetAmount} from '../../domain/program/progress';
import {useAliveBreath} from '../../hooks/useAlive';
import {steppedBreath} from '../../lib/aliveMath';

/** Visible window: how many past + future rows we render. */
const VISIBLE_PAST = 3;
const VISIBLE_FUTURE = 4;

export type RetroOutcome = 'sealed' | 'skipped' | 'ignored';

export interface RibbonProps {
  rows: RibbonRow[];
  now: number;
  onSeal?: (row: RibbonRow, amount?: number) => void;
  onSkip?: (row: RibbonRow) => void;
  onSnooze?: (row: RibbonRow) => void;
  onRetroLog?: (row: RibbonRow, outcome: RetroOutcome) => void;
}
export function Ribbon({
  rows,
  now,
  onSeal,
  onSkip,
  onSnooze,
  onRetroLog,
}: RibbonProps) {
  const [expandedAbsorbedId, setExpandedAbsorbedId] = useState<string | null>(null);
  const visible = sliceVisible(rows, now);
  const nowIdx = visible.findIndex(
    r => r.kind === 'now-active' || r.kind === 'now-idle',
  );

  return (
    <View style={styles.container}>
      {visible.map((row, i) => {
        const isNow = i === nowIdx;
        const isExpandedAbsorbed =
          row.kind === 'past-absorbed' && expandedAbsorbedId === row.id;
        return (
          <View
            key={row.id}
            style={[
              styles.rowSlot,
              isNow && styles.rowSlotNow,
              !isNow && row.at < now && styles.rowSlotPast,
              !isNow && row.at > now && styles.rowSlotFuture,
              isExpandedAbsorbed && styles.rowSlotExpanded,
            ]}>
            <RibbonRowView
              row={row}
              isNow={isNow}
              now={now}
              expanded={isExpandedAbsorbed}
              onSeal={onSeal}
              onSkip={onSkip}
              onSnooze={onSnooze}
              onAbsorbedPress={() =>
                setExpandedAbsorbedId(prev =>
                  prev === row.id ? null : row.id,
                )
              }
              onRetroOutcome={outcome => {
                setExpandedAbsorbedId(null);
                onRetroLog?.(row, outcome);
              }}
            />
            {/* Now-line: render under the now-row's bottom edge */}
            {isNow && <View style={styles.nowLine} />}
          </View>
        );
      })}
    </View>
  );
}

/** Center the visible window on the now-row, keeping VISIBLE_PAST
 *  before and VISIBLE_FUTURE after. */
function sliceVisible(rows: RibbonRow[], _now: number): RibbonRow[] {
  if (rows.length === 0) {
    return rows;
  }
  const nowIdx = rows.findIndex(
    r => r.kind === 'now-active' || r.kind === 'now-idle',
  );
  if (nowIdx < 0) {
    return rows.slice(-VISIBLE_PAST - 1 - VISIBLE_FUTURE);
  }
  const start = Math.max(0, nowIdx - VISIBLE_PAST);
  const end = Math.min(rows.length, nowIdx + 1 + VISIBLE_FUTURE);
  return rows.slice(start, end);
}

// ── Row ────────────────────────────────────────────────────────────

interface RibbonRowViewProps {
  row: RibbonRow;
  isNow: boolean;
  now: number;
  expanded: boolean;
  onSeal?: (row: RibbonRow, amount?: number) => void;
  onSkip?: (row: RibbonRow) => void;
  onSnooze?: (row: RibbonRow) => void;
  onAbsorbedPress: () => void;
  onRetroOutcome: (outcome: RetroOutcome) => void;
}

function RibbonRowViewImpl({
  row,
  isNow,
  now,
  expanded,
  onSeal,
  onSkip,
  onSnooze,
  onAbsorbedPress,
  onRetroOutcome,
}: RibbonRowViewProps) {
  const el = ELEMENTS[row.element];
  const tint = el.color;
  const dim = el.deep;

  const glyph = glyphForKind(row.kind);
  const timeLabel = formatHHMM(row.at);

  if (isNow && row.kind === 'now-active' && row.active) {
    return (
      <ActiveRow
        row={row}
        now={now}
        onSeal={onSeal}
        onSkip={onSkip}
        onSnooze={onSnooze}
      />
    );
  }

  if (isNow && row.kind === 'now-idle') {
    return (
      <View style={[styles.row, styles.rowIdle]}>
        <View style={styles.timeCol}>
          <Text style={[styles.timeText, styles.timeTextActive]}>{timeLabel}</Text>
        </View>
        <View style={styles.bodyCol}>
          <Text style={styles.idleLabel}>STANDBY</Text>
          <Text style={styles.idleDetail}>watching the cadence</Text>
        </View>
      </View>
    );
  }

  // Past or future row.
  const isPast = !isNow && row.at < Date.now();
  const interactive = row.kind === 'past-absorbed';
  return (
    <View>
      <RowWrap interactive={interactive} onPress={onAbsorbedPress}>
        <View style={styles.timeCol}>
          <Text
            style={[
              styles.timeText,
              isPast ? styles.timeTextPast : styles.timeTextFuture,
            ]}>
            {timeLabel}
          </Text>
          <Text style={[styles.glyphSmall, {color: dim}]}>{el.glyph}</Text>
        </View>
        <View style={styles.kindMark}>
          <Text style={[styles.kindGlyph, {color: kindColor(row.kind, tint, dim)}]}>
            {glyph}
          </Text>
        </View>
        <View style={styles.bodyCol}>
          <Text
            style={[
              styles.label,
              row.kind === 'past-skipped' && styles.labelStrike,
              (row.kind === 'past-ignored' || row.kind === 'past-absorbed') &&
                styles.labelDim,
            ]}
            numberOfLines={1}>
            {row.label}
          </Text>
          {row.detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {row.detail}
            </Text>
          ) : null}
        </View>
      </RowWrap>
      {expanded && row.kind === 'past-absorbed' ? (
        <View style={styles.retroRow}>
          <Pressable
            style={[styles.retroBtn, {backgroundColor: tint}]}
            onPress={() => onRetroOutcome('sealed')}>
            <Text style={[styles.retroBtnText, {color: '#000'}]}>Sealed</Text>
          </Pressable>
          <Pressable
            style={[styles.retroBtnGhost, {borderColor: tint}]}
            onPress={() => onRetroOutcome('skipped')}>
            <Text style={[styles.retroBtnText, {color: tint}]}>Skipped</Text>
          </Pressable>
          <Pressable
            style={[styles.retroBtnGhost, {borderColor: dim}]}
            onPress={() => onRetroOutcome('ignored')}>
            <Text style={[styles.retroBtnText, {color: dim}]}>Ignored</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Rows re-render only when what they show changes. The panel ticks `now`
 * every second; before this, every row re-rendered (and remounted, via an
 * inline wrapper component) each tick. Only the now-row needs `now`.
 * Handler props are ignored: the panel's handlers are stable callbacks and
 * per-row closures capture only the row's id and stable setters.
 */
function rowPropsEqual(prev: RibbonRowViewProps, next: RibbonRowViewProps): boolean {
  if (prev.isNow !== next.isNow || prev.expanded !== next.expanded) {
    return false;
  }
  if (next.isNow && prev.now !== next.now) {
    return false;
  }
  const a = prev.row;
  const b = next.row;
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.at === b.at &&
    a.element === b.element &&
    a.label === b.label &&
    a.detail === b.detail &&
    a.active?.expiresAt === b.active?.expiresAt
  );
}

const RibbonRowView = React.memo(RibbonRowViewImpl, rowPropsEqual);

function RowWrap({
  interactive,
  onPress,
  children,
}: {
  interactive: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  if (interactive) {
    return (
      <Pressable
        style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
        onPress={onPress}>
        {children}
      </Pressable>
    );
  }
  return <View style={styles.row}>{children}</View>;
}

interface ActiveRowProps {
  row: RibbonRow;
  now: number;
  onSeal?: (row: RibbonRow, amount?: number) => void;
  onSkip?: (row: RibbonRow) => void;
  onSnooze?: (row: RibbonRow) => void;
}

/**
 * Hero now-active row: large glyph + drill name + cues + expiry meter +
 * Seal/Snooze/Skip CTAs. Per Always-On Ribbon plan §7, this row owns ~40%
 * of the visible ribbon real-estate. Daily Sets pulses add a −/+ stepper
 * so the operator seals the amount they actually did.
 */
function ActiveRow({row, now, onSeal, onSkip, onSnooze}: ActiveRowProps) {
  const active = row.active!;
  const rx = active.prescription;
  const [amount, setAmount] = useState(rx?.amount ?? 0);
  const el = ELEMENTS[row.element];
  const tint = el.color;
  const dim = el.deep;
  const totalMs = Math.max(1, active.expiresAt - row.at);
  const remainingMs = Math.max(0, active.expiresAt - now);
  const meterPct = Math.max(0, Math.min(1, remainingMs / totalMs));
  const step = rx?.unit === 'seconds' ? 5 : 1;
  // The card's accent breathes with the alive clock — at 0.4 Hz while a
  // pulse is active (FR-6.5). Opacity only; a steady border when motion
  // is resting.
  const {phase, budget} = useAliveBreath();
  const accentOpacity = useMemo(
    () =>
      budget.breathMax > 0 ? phase.interpolate(steppedBreath(0.35, 1, 6)) : 1,
    [phase, budget],
  );
  return (
    <View style={[styles.row, styles.rowActive, {borderColor: dim}]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.activeAccent, {borderColor: tint, opacity: accentOpacity}]}
      />
      <View style={[styles.timeCol, styles.timeColActive]}>
        <Text style={[styles.timeText, styles.timeTextActive]}>{formatHHMM(row.at)}</Text>
        <Text style={[styles.glyphHero, {color: tint}]}>{el.glyph}</Text>
      </View>
      <View style={styles.bodyCol}>
        <Text style={[styles.activeLabel, {color: tint}]} numberOfLines={1}>
          {row.label.toUpperCase()}
        </Text>
        {rx ? (
          <View style={styles.rxRow}>
            <Pressable
              accessibilityLabel="Less"
              hitSlop={8}
              style={[styles.stepBtn, {borderColor: dim}]}
              onPress={() => setAmount(a => Math.max(0, a - step))}>
              <Text style={[styles.stepText, {color: tint}]}>−</Text>
            </Pressable>
            <Text style={[styles.rxAmount, {color: tint}]}>
              {formatSetAmount(amount, rx.unit)}
            </Text>
            <Pressable
              accessibilityLabel="More"
              hitSlop={8}
              style={[styles.stepBtn, {borderColor: dim}]}
              onPress={() => setAmount(a => a + step)}>
              <Text style={[styles.stepText, {color: tint}]}>+</Text>
            </Pressable>
            <Text style={styles.rxSet}>
              set {rx.setIndex}/{rx.sets}
            </Text>
          </View>
        ) : null}
        {active.cuesShort.slice(0, rx ? 3 : 4).map((cue, idx) => (
          <Text key={idx} style={styles.activeCue} numberOfLines={1}>
            · {cue}
          </Text>
        ))}
        <View style={styles.meterTrack}>
          <View
            style={[
              styles.meterFill,
              {backgroundColor: tint, width: `${meterPct * 100}%`},
            ]}
          />
        </View>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtnLarge, {backgroundColor: tint}]}
            onPress={() => onSeal?.(row, rx ? amount : undefined)}>
            <Text style={[styles.actionTextLarge, {color: '#000'}]}>
              {el.verbDone ?? 'Seal'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtnGhost, {borderColor: tint}]}
            onPress={() => onSnooze?.(row)}>
            <Text style={[styles.actionText, {color: tint}]}>+5</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtnGhost, {borderColor: dim}]}
            onPress={() => onSkip?.(row)}>
            <Text style={[styles.actionText, {color: dim}]}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function glyphForKind(kind: RibbonRowKind): string {
  switch (kind) {
    case 'past-sealed':
      return '●';
    case 'past-skipped':
      return '○';
    case 'past-snoozed':
      return '◐';
    case 'past-ignored':
      return '◌';
    case 'past-absorbed':
      return '◇';
    case 'future':
      return '◯';
    case 'now-active':
    case 'now-idle':
      return '◉';
  }
}

function kindColor(
  kind: RibbonRowKind,
  tint: string,
  dim: string,
): string {
  if (kind === 'past-sealed') {
    return tint;
  }
  if (kind === 'past-skipped' || kind === 'past-ignored') {
    return palette.textMuted;
  }
  if (kind === 'past-snoozed' || kind === 'past-absorbed') {
    return dim;
  }
  return dim;
}

function formatHHMM(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  /** Rows share the height the active card leaves over and clip to their
      slot. As flex shares with a floor they overflowed into the card. */
  rowSlot: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowSlotPast: {
    flex: 0.7,
    opacity: 0.85,
  },
  rowSlotFuture: {
    flex: 0.85,
    opacity: 0.95,
  },
  /** The active card takes its natural height. */
  rowSlotNow: {
    flex: 0,
    flexShrink: 0,
    overflow: 'visible',
  },
  rowSlotExpanded: {
    flex: 1.4,
  },
  nowLine: {
    height: 2,
    backgroundColor: palette.border,
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowActive: {
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  activeAccent: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  rowIdle: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  timeCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0,
  },
  timeColActive: {
    width: 72,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  timeText: {
    ...t.caption,
    fontVariant: ['tabular-nums'],
  },
  timeTextPast: {
    color: palette.textMuted,
  },
  timeTextFuture: {
    color: palette.textDim,
  },
  timeTextActive: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
  },
  glyph: {
    fontSize: 22,
    marginTop: 2,
  },
  glyphHero: {
    fontSize: 44,
    marginTop: spacing.sm,
    lineHeight: 50,
  },
  glyphSmall: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.7,
  },
  kindMark: {
    width: 20,
    alignItems: 'center',
  },
  kindGlyph: {
    fontSize: 16,
    fontWeight: '700',
  },
  bodyCol: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...t.body,
    color: palette.text,
  },
  labelStrike: {
    textDecorationLine: 'line-through',
    color: palette.textDim,
  },
  labelDim: {
    color: palette.textDim,
  },
  detail: {
    ...t.caption,
    color: palette.textDim,
  },
  activeLabel: {
    ...t.subtitle,
    color: palette.text,
    letterSpacing: 0.8,
  },
  activeDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  activeCue: {
    ...t.body,
    color: palette.text,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  meterTrack: {
    height: 3,
    backgroundColor: palette.border,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  meterFill: {
    height: 3,
    borderRadius: 2,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
  },
  rxAmount: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 96,
    textAlign: 'center',
  },
  rxSet: {
    ...t.caption,
    color: palette.textDim,
    marginLeft: spacing.xs,
  },
  idleLabel: {
    ...t.subtitle,
    color: palette.textDim,
    letterSpacing: 1.4,
  },
  idleDetail: {
    ...t.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  actionBtnLarge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 96,
    alignItems: 'center',
  },
  actionBtnGhost: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  actionText: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actionTextLarge: {
    ...t.subtitle,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  retroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg + 56 + 20,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  retroBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  retroBtnGhost: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  retroBtnText: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

// ── Helper exports for unit tests ─────────────────────────────────
export const __test = {sliceVisible, glyphForKind, formatHHMM};

// Suppress unused warnings for prop helpers when element id isn't used.
export type _ElementId = ElementId;
