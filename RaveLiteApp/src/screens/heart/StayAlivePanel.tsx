/**
 * StayAlivePanel — Heart > Settings › Stay alive.
 *
 * A live checklist of what keeps chimes firing on this phone, problems
 * first, each with a button to the system screen that fixes it or a
 * "Mark done" for things Android won't report. Re-checks whenever the
 * app returns to the foreground (i.e. after visiting system settings).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {AppState, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  gatherHealthInputs,
  openHealthFix,
  readConfirmations,
  setConfirmed,
  summarizeHealth,
  type HealthInputs,
  type HealthStatus,
} from '../../domain/ambient/healthChecks';
import {NOT_OURS, keepAliveSteps} from '../../domain/ambient/keepAlive';
import {deviceFacts} from '../../native/deviceFacts';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const STATUS_GLYPH: Record<HealthStatus, string> = {
  ok: '●',
  warn: '▲',
  unknown: '○',
};

const STATUS_WORD: Record<HealthStatus, string> = {
  ok: 'Done',
  warn: 'Needs doing',
  unknown: "Can't check",
};

const STATUS_COLOR: Record<HealthStatus, string> = {
  ok: ELEMENTS.earth.color,
  warn: '#FFD60A',
  unknown: palette.textFaint,
};

export function StayAlivePanel() {
  const [inputs, setInputs] = useState<HealthInputs | null>(null);

  const refresh = useCallback(() => {
    gatherHealthInputs().then(setInputs);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const accent = ELEMENTS.heart.accent;

  if (!inputs) {
    return (
      <View style={styles.panel}>
        <Text
          accessibilityRole="header"
          style={[styles.eyebrow, {color: accent}]}>
          ▸ STAY ALIVE
        </Text>
        <Text style={styles.body}>Checking this phone…</Text>
      </View>
    );
  }

  const {checks, warnings} = summarizeHealth(inputs);
  const keepAlive = keepAliveSteps(deviceFacts().manufacturer);

  return (
    <View style={styles.panel}>
      <Text
        accessibilityRole="header"
        style={[styles.eyebrow, {color: accent}]}>
        ▸ STAY ALIVE
      </Text>
      <Text style={styles.body}>
        {warnings === 0
          ? 'All set. Chimes should work all day.'
          : `${warnings} thing${
              warnings === 1 ? '' : 's'
            } could stop chimes on this phone.`}
      </Text>

      {checks.map(check => {
        const confirmed = check.confirm
          ? inputs.confirmed[check.confirm]
          : false;
        return (
          <View key={check.id} style={styles.row}>
            <Text
              style={[styles.glyph, {color: STATUS_COLOR[check.status]}]}
              importantForAccessibility="no">
              {STATUS_GLYPH[check.status]}
            </Text>
            <View style={styles.copy}>
              {/* The titles used to name the passing state ("Battery: no
                  restrictions"), so a failing row still read as a pass and
                  only the colour said otherwise. They are plain nouns now,
                  and the verdict is a word on the row — for everybody, not
                  only for the screen reader that always had it. */}
              <View
                accessible
                accessibilityLabel={`${STATUS_WORD[check.status]}: ${
                  check.title
                }. ${check.detail}`}>
                <Text style={styles.title}>
                  {check.title}
                  <Text style={{color: STATUS_COLOR[check.status]}}>
                    {` — ${STATUS_WORD[check.status].toLowerCase()}`}
                  </Text>
                </Text>
                <Text style={styles.detail}>{check.detail}</Text>
              </View>
              {check.fix || check.confirm ? (
                <View style={styles.actions}>
                  {check.fix ? (
                    <Tap
                      variant="ghost"
                      color={accent}
                      onPress={() => {
                        openHealthFix(check.fix!).catch(() => {});
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open settings for ${check.title}`}
                      style={styles.btn}>
                      <Text style={[styles.btnText, {color: accent}]}>
                        Open settings
                      </Text>
                    </Tap>
                  ) : null}
                  {check.confirm ? (
                    <Tap
                      variant={confirmed ? 'solid' : 'ghost'}
                      color={confirmed ? ELEMENTS.earth.color : palette.textDim}
                      accessibilityRole="checkbox"
                      accessibilityState={{checked: confirmed}}
                      accessibilityLabel={`${check.title}: mark done`}
                      onPress={() => {
                        setConfirmed(check.confirm!, !confirmed);
                        setInputs({...inputs, confirmed: readConfirmations()});
                      }}
                      style={styles.btn}>
                      <Text
                        style={[
                          styles.btnText,
                          {color: confirmed ? palette.bg : palette.text},
                        ]}>
                        {confirmed ? 'Done ✓' : 'Mark done'}
                      </Text>
                    </Tap>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      {/* What this phone's maker does on top of Android, which no app can
          read — so it is named rather than checked, and only once
          something has actually gone wrong. */}
      {warnings > 0 ? (
        <View testID="stay-alive-maker" style={styles.maker}>
          <Text accessibilityRole="header" style={styles.title}>
            {`What ${keepAlive.maker} phones need`}
          </Text>
          {keepAlive.steps.map(step => (
            <Text key={step} style={styles.detail}>
              {`• ${step}`}
            </Text>
          ))}
          <Text style={styles.detail}>{NOT_OURS}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  body: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 21,
  },
  maker: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  glyph: {
    fontSize: 14,
    lineHeight: 22,
    width: 16,
    textAlign: 'center',
  },
  copy: {flex: 1},
  title: {
    ...t.subtitle,
    color: palette.text,
  },
  detail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
