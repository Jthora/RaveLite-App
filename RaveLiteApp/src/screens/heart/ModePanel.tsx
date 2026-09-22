/**
 * "Today I'm…" — the one row that says what is true right now.
 *
 * Everything else in Settings is a decision about your life. This is a
 * decision about your afternoon, and it undoes itself: each mode carries
 * its own expiry, so the honest answer to "what if I forget to turn it
 * off" is that you can't.
 *
 * An injury is the exception, and it should be: only the person with the
 * shoulder knows when the shoulder is better. It is also kept apart from
 * the modes, so a day off or a festival sits on top of it instead of
 * ending it — resting used to switch the protection off.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {REGIONS} from '../../domain/profile/kit';
import type {Region} from '../../domain/profile/kit';
import {MODES, modeLabel, type ModeId} from '../../domain/profile/mode';
import {
  clearInjury,
  clearMode,
  loadInjured,
  loadMode,
  setInjury,
  setMode,
} from '../../domain/profile/repository';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** One colour and one picture per mode, the same everywhere it appears. */
export const MODE_SYMBOL: Record<ModeId, SymbolName> = {
  travelling: 'travelling',
  injured: 'injured',
  festival: 'festival',
  rest: 'resting',
};

/** Said wherever an injury is on. */
export const SEE_SOMEONE =
  'If it is sharp, numb, or no better in a week, see a doctor or physio.';

export function ModePanel({showTitle = true}: {showTitle?: boolean} = {}) {
  const [, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);
  /** Whether the body-part picker for an injury is open. */
  const [asking, setAsking] = useState(false);

  const accent = ELEMENTS.heart.accent;
  const now = Date.now();
  const stored = loadMode(now);
  // An injury is its own card now; a hurt mode stored before that is it.
  const mode = stored?.id === 'injured' ? undefined : stored;
  const injured = loadInjured(now);

  const start = (id: ModeId) => {
    if (id === 'injured') {
      setAsking(a => !a);
      return;
    }
    setMode(id);
    refresh();
  };

  const hurt = (region: Region) => {
    setInjury(region);
    setAsking(false);
    refresh();
  };

  // A mode sits on top of an injury, so both can be offered at once.
  const offered = MODES.filter(spec =>
    spec.id === 'injured' ? !injured : !mode,
  );

  return (
    <View style={styles.root}>
      {showTitle ? <Text style={styles.eyebrow}>TODAY I'M…</Text> : null}
      {injured ? (
        <ActiveCard
          testID="injury-active"
          endTestID="injury-clear"
          symbol={MODE_SYMBOL.injured}
          label={`Hurt · ${injured}`}
          detail="Drills that load it are skipped. Progress pauses until you end this."
          note={SEE_SOMEONE}
          endLabel="End hurt mode"
          onEnd={() => {
            clearInjury();
            refresh();
          }}
        />
      ) : null}
      {mode ? (
        <ActiveCard
          testID="mode-active"
          endTestID="mode-clear"
          symbol={MODE_SYMBOL[mode.id]}
          label={modeLabel(mode, now)}
          detail={MODES.find(m => m.id === mode.id)?.detail}
          endLabel="End this mode"
          onEnd={() => {
            clearMode();
            refresh();
          }}
        />
      ) : null}
      {!mode ? (
        <Text style={styles.caption}>
          Each mode shows when it ends before you pick it.
        </Text>
      ) : null}
      {offered.map(spec => (
        <View key={spec.id}>
          <Tap
            testID={`mode-${spec.id}`}
            variant="plain"
            onPress={() => start(spec.id)}
            accessibilityRole="button"
            accessibilityLabel={`Today I'm ${spec.name}. ${spec.detail}`}
            style={[
              styles.row,
              asking && spec.id === 'injured' && {borderColor: accent},
            ]}>
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: tint(hueOf(MODE_SYMBOL[spec.id]))},
                ]}>
                <Symbol name={MODE_SYMBOL[spec.id]} size={20} />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowName,
                    asking &&
                      spec.id === 'injured' && {
                        color: hueOf(MODE_SYMBOL[spec.id]),
                      },
                  ]}>
                  {spec.name}
                </Text>
                <Text style={styles.rowDetail}>{spec.detail}</Text>
              </View>
              <Text style={styles.means}>
                {spec.days === undefined
                  ? 'until you end it'
                  : spec.days === 1
                  ? 'today'
                  : `${spec.days} days`}
              </Text>
            </View>
          </Tap>
          {asking && spec.id === 'injured' ? (
            <View style={styles.regions}>
              <Text style={styles.caption}>Where does it hurt?</Text>
              <View style={styles.pills}>
                {REGIONS.map(region => (
                  <Tap
                    key={region}
                    testID={`region-${region}`}
                    variant="ghost"
                    color={palette.textDim}
                    onPress={() => hurt(region)}
                    accessibilityRole="button"
                    accessibilityLabel={`Hurt ${region}`}
                    style={styles.pill}>
                    <Text style={styles.rowBtnText}>{region}</Text>
                  </Tap>
                ))}
              </View>
              <Text style={styles.caption}>{SEE_SOMEONE}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ActiveCard({
  testID,
  endTestID,
  symbol,
  label,
  detail,
  note,
  endLabel,
  onEnd,
}: {
  testID: string;
  endTestID: string;
  symbol: SymbolName;
  label: string;
  detail?: string;
  note?: string;
  endLabel: string;
  onEnd: () => void;
}) {
  return (
    <View
      style={[
        styles.active,
        {borderColor: hueOf(symbol), backgroundColor: tint(hueOf(symbol))},
      ]}>
      <View
        style={[styles.badge, {backgroundColor: tint(hueOf(symbol), '29')}]}>
        <Symbol name={symbol} size={20} />
      </View>
      <View style={styles.rowText}>
        <Text testID={testID} style={[styles.rowName, {color: hueOf(symbol)}]}>
          {label}
        </Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
      <Tap
        testID={endTestID}
        variant="ghost"
        color={palette.textDim}
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel={endLabel}
        style={styles.rowBtn}>
        <Text style={styles.rowBtnText}>End</Text>
      </Tap>
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
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.surface,
    padding: spacing.md,
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
  rowBtn: {
    minWidth: 72,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  rowBtnText: {
    ...t.subtitle,
    color: palette.text,
  },
  rowNote: {
    ...t.caption,
    color: palette.text,
    marginTop: spacing.xs,
  },
  regions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
