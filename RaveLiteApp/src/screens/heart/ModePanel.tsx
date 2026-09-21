/**
 * "Today I'm…" — the one row that says what is true right now.
 *
 * Everything else in Settings is a decision about your life. This is a
 * decision about your afternoon, and it undoes itself: each mode carries
 * its own expiry, so the honest answer to "what if I forget to turn it
 * off" is that you can't.
 *
 * An injury is the exception, and it should be: only the person with the
 * shoulder knows when the shoulder is better.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {REGIONS} from '../../domain/profile/kit';
import type {Region} from '../../domain/profile/kit';
import {MODES, modeLabel, type ModeId} from '../../domain/profile/mode';
import {clearMode, loadMode, setMode} from '../../domain/profile/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export function ModePanel() {
  const [mode, setLocal] = useState(() => loadMode());
  /** Which mode is waiting on a region before it starts. */
  const [asking, setAsking] = useState<ModeId | undefined>();

  const accent = ELEMENTS.heart.accent;
  const now = Date.now();

  const start = (id: ModeId, region?: Region) => {
    if (id === 'injured' && !region) {
      setAsking(asking === id ? undefined : id);
      return;
    }
    setMode(id, region ? {region} : {});
    setAsking(undefined);
    setLocal(loadMode());
  };

  const stop = () => {
    clearMode();
    setAsking(undefined);
    setLocal(undefined);
  };

  if (mode) {
    return (
      <View style={styles.root}>
        <Text style={styles.eyebrow}>TODAY I'M…</Text>
        <View style={[styles.active, {borderColor: accent}]}>
          <View style={styles.rowText}>
            <Text
              testID="mode-active"
              style={[styles.rowName, {color: accent}]}>
              {modeLabel(mode, now)}
            </Text>
            <Text style={styles.rowDetail}>
              {MODES.find(m => m.id === mode.id)?.detail}
            </Text>
          </View>
          <Tap
            testID="mode-clear"
            variant="ghost"
            color={palette.textDim}
            onPress={stop}
            accessibilityRole="button"
            accessibilityLabel="End this mode"
            style={styles.rowBtn}>
            <Text style={styles.rowBtnText}>Done</Text>
          </Tap>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>TODAY I'M…</Text>
      <Text style={styles.caption}>
        Nothing here sticks. Each one says when it ends as you pick it, so the
        app bends round a week instead of you working round the app.
      </Text>
      {MODES.map(spec => (
        <View key={spec.id}>
          <Tap
            testID={`mode-${spec.id}`}
            variant="plain"
            onPress={() => start(spec.id)}
            accessibilityRole="button"
            accessibilityLabel={`Today I'm ${spec.name}. ${spec.detail}`}
            style={[styles.row, asking === spec.id && {borderColor: accent}]}>
            <View style={styles.rowInner}>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{spec.name}</Text>
                <Text style={styles.rowDetail}>{spec.detail}</Text>
              </View>
              <Text style={styles.means}>
                {spec.days === undefined
                  ? 'until cleared'
                  : spec.days === 1
                  ? 'today'
                  : `${spec.days} days`}
              </Text>
            </View>
          </Tap>
          {asking === spec.id ? (
            <View style={styles.regions}>
              {REGIONS.map(region => (
                <Tap
                  key={region}
                  testID={`region-${region}`}
                  variant="ghost"
                  color={palette.textDim}
                  onPress={() => start('injured', region)}
                  accessibilityRole="button"
                  accessibilityLabel={`Hurt ${region}`}
                  style={styles.pill}>
                  <Text style={styles.rowBtnText}>{region}</Text>
                </Tap>
              ))}
            </View>
          ) : null}
        </View>
      ))}
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
  regions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
