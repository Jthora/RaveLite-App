import React, {useMemo, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import {formatEta, formatHM} from '../ambient/format';
import {ElementGlyph} from '../icons/ElementGlyph';
import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {useAliveBreath} from '../../hooks/useAlive';
import {steppedBreath} from '../../lib/aliveMath';
import {
  EYE_BREAK_SECONDS,
  isWaterCallDrill,
} from '../../domain/activity/record';
import type {ActivePulseSummary} from '../../domain/ambient/types';
import {
  moveForExercise,
  moveForTrack,
  type MoveId,
} from '../../domain/exercises/moves';
import {
  groupCard,
  infoFor,
  roundCard,
  type InfoCard,
} from '../../domain/info/info';
import {formatSetAmount} from '../../domain/program/progress';
import type {SetUnit, TrackId} from '../../domain/program/types';
import type {DayRow} from '../../domain/today/dayList';
import {ELEMENTS, type ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export interface DoneAdjust {
  /** Single set: the amount actually done. */
  amount?: number;
  /** Round: the amount done per move (0 = skipped that move). */
  amounts?: Partial<Record<TrackId, number>>;
}

export interface ChimeCardProps {
  now: number;
  /** The chime sounding right now. */
  active?: ActivePulseSummary;
  /** The next chime on today's list, shown when nothing is sounding. */
  next?: DayRow;
  onDone: (adjust: DoneAdjust) => void;
  onSnooze: () => void;
  onSkip: () => void;
  onDeferNext: () => void;
  onSkipNext: () => void;
  /** Chimes are paused until then. */
  pauseUntil?: number;
  onResume?: () => void;
  /** "What is this?" — the card for what's being asked for. */
  onInfo?: (card: InfoCard) => void;
}

/**
 * The top of Today. While a chime sounds: what to do (each move of a round
 * with its own −/+), its partner and glass, a draining answer window, and
 * Done / +5 / Skip. Otherwise: the next chime, with +5 and Skip.
 */
/** The circled i that opens the card behind whatever is being asked for. */
function InfoTap({
  color,
  label,
  onPress,
}: {
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Tap
      testID="chime-info"
      variant="plain"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`What is ${label}?`}
      style={styles.info}>
      <Text style={[styles.infoMark, {color}]}>ⓘ</Text>
    </Tap>
  );
}

/** The move on a soft square of its element's color; the element glyph when there is none. */
function MoveTile({
  move,
  color,
  element,
  idle,
}: {
  move?: MoveId;
  color: string;
  element: ElementIdentity;
  idle?: boolean;
}) {
  if (!move) {
    return (
      <View style={styles.glyphBox}>
        <ElementGlyph
          element={element}
          size={idle ? 28 : 32}
          color={color}
          style={[styles.glyph, idle && styles.glyphIdle]}
        />
      </View>
    );
  }
  return (
    <View
      style={[
        styles.tile,
        idle && styles.tileIdle,
        {backgroundColor: `${color}29`},
      ]}>
      <MoveIcon move={move} color={color} size={idle ? 28 : 32} />
    </View>
  );
}

export function ChimeCard(props: ChimeCardProps) {
  return props.active ? (
    <ActiveCard key={props.active.pulseId} {...props} active={props.active} />
  ) : (
    <NextCard {...props} />
  );
}

function ActiveCard({
  now,
  active,
  onDone,
  onSnooze,
  onSkip,
  onInfo,
}: ChimeCardProps & {active: ActivePulseSummary}) {
  const el = ELEMENTS[active.element];
  const rx = active.prescription;
  const moves = rx?.moves;
  const [amounts, setAmounts] = useState<Partial<Record<TrackId, number>>>(() =>
    Object.fromEntries((moves ?? []).map(m => [m.trackId, m.amount])),
  );
  const [amount, setAmount] = useState(rx?.amount ?? 0);

  // The border breathes with the alive clock (0.4 Hz while a chime is
  // active); steady when motion rests.
  const {phase, budget} = useAliveBreath();
  const accentOpacity = useMemo(
    () =>
      budget.breathMax > 0 ? phase.interpolate(steppedBreath(0.35, 1, 6)) : 1,
    [phase, budget],
  );

  const windowMs = Math.max(1, active.expiresAt - active.fireAt);
  const left = Math.max(0, Math.min(1, (active.expiresAt - now) / windowMs));
  const title = moves
    ? rx?.roundIndex && rx.rounds
      ? `Round ${rx.roundIndex} of ${rx.rounds}`
      : 'Round'
    : active.drillName;

  const done = () => onDone(moves ? {amounts} : rx ? {amount} : {});

  return (
    <View style={[styles.card, {borderColor: el.deep}]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.accent, {borderColor: el.color, opacity: accentOpacity}]}
      />
      <View style={styles.head}>
        <MoveTile
          move={
            moveForTrack(rx?.moves?.[0]?.trackId ?? rx?.trackId) ??
            moveForExercise(active.drillId)
          }
          color={el.color}
          element={el}
        />
        <View style={styles.headText}>
          <Text style={[styles.eyebrow, {color: el.color}]}>
            NOW · {formatHM(active.fireAt)}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        {onInfo ? (
          <InfoTap
            color={el.color}
            label={title}
            onPress={() =>
              onInfo(
                rx
                  ? roundCard(rx, active.element)
                  : infoFor({kind: 'drill', id: active.drillId}) ?? {
                      title: active.drillName,
                      element: active.element,
                      what: active.cuesShort.join(' · '),
                    },
              )
            }
          />
        ) : null}
      </View>

      {active.note ? (
        <Text style={[styles.note, {color: el.color}]}>{active.note}</Text>
      ) : null}
      {moves ? (
        moves.map(m => (
          <AmountRow
            key={m.trackId}
            label={m.label}
            unit={m.unit}
            value={amounts[m.trackId] ?? m.amount}
            color={el.color}
            onChange={v => setAmounts(a => ({...a, [m.trackId]: v}))}
          />
        ))
      ) : rx ? (
        <AmountRow
          label={rx.label}
          unit={rx.unit}
          value={amount}
          color={el.color}
          onChange={setAmount}
        />
      ) : (
        active.cuesShort.slice(0, 3).map((cue, i) => (
          <Text key={i} style={styles.cue} numberOfLines={2}>
            · {cue}
          </Text>
        ))
      )}
      {rx?.partner ? (
        <Text style={styles.extra}>
          then {rx.partner.seconds} s · {rx.partner.label}
        </Text>
      ) : null}
      {rx?.water ? <Text style={styles.extra}>+ a glass of water</Text> : null}
      {rx?.water || isWaterCallDrill(active.drillId) ? (
        <Text style={styles.extra}>
          then {EYE_BREAK_SECONDS} s · eyes on something far away
        </Text>
      ) : null}

      <View style={styles.meter}>
        <View
          style={[
            styles.meterFill,
            {backgroundColor: el.color, width: `${left * 100}%`},
          ]}
        />
      </View>

      <View style={styles.actions}>
        <Tap
          testID="chime-done"
          variant="solid"
          color={el.color}
          onPress={done}
          accessibilityRole="button"
          style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={el.color}
          onPress={onSnooze}
          accessibilityRole="button"
          accessibilityLabel="Remind me in 5 minutes"
          style={styles.secondary}>
          <Text style={[styles.secondaryText, {color: el.color}]}>+5</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={onSkip}
          accessibilityRole="button"
          style={styles.secondary}>
          <Text style={styles.secondaryText}>Skip</Text>
        </Tap>
      </View>
    </View>
  );
}

export function AmountRow({
  label,
  unit,
  value,
  color,
  onChange,
}: {
  label: string;
  unit: SetUnit;
  value: number;
  color: string;
  onChange: (next: number) => void;
}) {
  const step = unit === 'seconds' ? 5 : 1;
  return (
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel} numberOfLines={1}>
        {label}
      </Text>
      <Tap
        variant="ghost"
        color={color}
        onPress={() => onChange(Math.max(0, value - step))}
        accessibilityLabel={`Less ${label}`}
        style={styles.stepBtn}>
        <Text style={[styles.stepText, {color}]}>−</Text>
      </Tap>
      <Text style={[styles.amount, {color}]}>
        {formatSetAmount(value, unit)}
      </Text>
      <Tap
        variant="ghost"
        color={color}
        onPress={() => onChange(value + step)}
        accessibilityLabel={`More ${label}`}
        style={styles.stepBtn}>
        <Text style={[styles.stepText, {color}]}>+</Text>
      </Tap>
    </View>
  );
}

/** The card behind a scheduled chime: its pieces, or the drill it asks for. */
export function cardForRow(row: DayRow): InfoCard {
  if (row.parts && row.parts.length > 0) {
    return groupCard({
      title: row.detail?.startsWith('Round')
        ? row.detail.split(' · ')[0]
        : row.label,
      element: row.element,
      what: 'A few small sets back to back, then something from another element to balance them.',
      subtitle: 'Daily Sets',
      parts: row.parts,
    });
  }
  const drill = row.exerciseId
    ? infoFor({kind: 'drill', id: row.exerciseId})
    : undefined;
  return (
    drill ?? {
      title: row.label,
      element: row.element,
      what: row.detail ?? "A chime on today's schedule.",
    }
  );
}

function NextCard({
  now,
  next,
  pauseUntil,
  onDeferNext,
  onSkipNext,
  onResume,
  onInfo,
}: ChimeCardProps) {
  if (pauseUntil !== undefined && pauseUntil > now) {
    return (
      <View style={[styles.card, styles.idle]}>
        <Text style={styles.eyebrowIdle}>CHIMES PAUSED</Text>
        <Text style={styles.titleIdle}>Back at {formatHM(pauseUntil)}</Text>
        <View style={styles.actions}>
          <Tap
            testID="chime-resume"
            variant="ghost"
            color={palette.textDim}
            onPress={onResume}
            accessibilityRole="button"
            style={styles.secondaryWide}>
            <Text style={styles.secondaryText}>Resume now</Text>
          </Tap>
        </View>
      </View>
    );
  }
  if (!next) {
    return (
      <View style={[styles.card, styles.idle]}>
        <Text style={styles.eyebrowIdle}>NO MORE CHIMES TODAY</Text>
        <Text style={styles.idleBody}>
          Log a session or open Practice whenever you like.
        </Text>
      </View>
    );
  }
  const el = ELEMENTS[next.element];
  return (
    <View style={[styles.card, styles.idle]}>
      <View style={styles.head}>
        <MoveTile move={next.move} color={el.color} element={el} idle />
        <View style={styles.headText}>
          <Text style={styles.eyebrowIdle}>
            NEXT · {formatHM(next.at)} · {formatEta(next.at - now)}
          </Text>
          <Text style={styles.titleIdle} numberOfLines={2}>
            {next.label}
          </Text>
          {next.detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {next.detail}
            </Text>
          ) : null}
        </View>
        {onInfo ? (
          <InfoTap
            color={el.color}
            label={next.label}
            onPress={() => onInfo(cardForRow(next))}
          />
        ) : null}
      </View>
      <View style={styles.actions}>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={onDeferNext}
          accessibilityRole="button"
          accessibilityLabel="Push the next chime back 5 minutes"
          style={styles.secondaryWide}>
          <Text style={styles.secondaryText}>+5 min</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={onSkipNext}
          accessibilityRole="button"
          accessibilityLabel="Skip the next chime"
          style={styles.secondaryWide}>
          <Text style={styles.secondaryText}>Skip it</Text>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  idle: {
    borderColor: palette.border,
  },
  note: {
    ...t.caption,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  accent: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  glyphBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 40,
    lineHeight: 46,
    width: 48,
    textAlign: 'center',
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIdle: {
    width: 44,
    height: 44,
    opacity: 0.85,
  },
  glyphIdle: {
    fontSize: 28,
    lineHeight: 34,
    opacity: 0.8,
  },
  headText: {
    flex: 1,
  },
  eyebrow: {
    ...t.caption,
    letterSpacing: 1.4,
  },
  eyebrowIdle: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.4,
  },
  title: {
    ...t.title,
    color: palette.text,
  },
  titleIdle: {
    ...t.subtitle,
    color: palette.text,
  },
  detail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  idleBody: {
    ...t.body,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  cue: {
    ...t.body,
    color: palette.text,
    marginTop: 2,
  },
  info: {
    minHeight: 48,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoMark: {
    fontSize: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  amountLabel: {
    ...t.body,
    color: palette.text,
    flex: 1,
  },
  stepBtn: {
    width: 48,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: radius.pill,
  },
  stepText: {
    fontSize: 22,
    fontWeight: '700',
  },
  amount: {
    minWidth: 76,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  extra: {
    ...t.body,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  meter: {
    height: 3,
    backgroundColor: palette.border,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  meterFill: {
    height: 3,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  done: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.pill,
  },
  doneText: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondary: {
    minWidth: 64,
    minHeight: 52,
    borderRadius: radius.pill,
  },
  secondaryWide: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  secondaryText: {
    ...t.subtitle,
    color: palette.text,
  },
});
