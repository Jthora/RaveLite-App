/**
 * ChimesPanel — Heart > Settings › Chimes.
 *
 * How chimes sound on this device:
 *   - master + per-element cue volume (0–100, multiplicative)
 *   - a test button per element (plays the cue directly; no journal write)
 *   - alarm-volume check — cues play on the alarm stream, so alarm volume
 *     is the ceiling, and 0 means silent
 *   - "Respect Do Not Disturb" toggle (off by default: chimes cut through)
 */
import React, {useCallback, useEffect, useState} from 'react';
import {AppState, StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../../components/icons/ElementGlyph';

import {Tap} from '../../components/Tap';
import {
  VOLUME_STEPS,
  cueSettingsFor,
  elementVolumes,
  getMasterVolume,
  getRespectDnd,
  setElementVolume,
  setMasterVolume,
  setRespectDnd,
} from '../../domain/ambient/cueVolume';
import {
  getAlarmVolume,
  hasDeviceModule,
  playCue,
} from '../../native/raveLiteDevice';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export function ChimesPanel() {
  // Settings live in storage; bump to re-read after a change.
  const [, setRevision] = useState(0);
  const bump = useCallback(() => setRevision(r => r + 1), []);
  const [alarm, setAlarm] = useState<{current: number; max: number} | null>(
    null,
  );
  const [testNote, setTestNote] = useState<string | null>(null);

  const refreshAlarm = useCallback(() => {
    getAlarmVolume().then(setAlarm);
  }, []);

  useEffect(() => {
    refreshAlarm();
    // The operator may fix alarm volume in system settings and come back.
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        refreshAlarm();
      }
    });
    return () => sub.remove();
  }, [refreshAlarm]);

  const test = useCallback(
    async (element: ElementId) => {
      const {volume} = cueSettingsFor(element);
      const played = await playCue(element, volume);
      if (played) {
        setTestNote(null);
      } else if (volume <= 0) {
        setTestNote(`${ELEMENTS[element].name} is set to Off.`);
      } else {
        setTestNote('Cue player not ready — try again in a moment.');
      }
      refreshAlarm();
    },
    [refreshAlarm],
  );

  const accent = ELEMENTS.heart.accent;
  const master = getMasterVolume();
  const respectDnd = getRespectDnd();

  return (
    <View style={styles.panel}>
      <Text style={[styles.eyebrow, {color: accent}]}>▸ CHIMES</Text>
      <Text style={styles.body}>
        Cues play on the alarm channel, so they sound through silent mode and Do
        Not Disturb during active hours. Alarm volume is the ceiling.
      </Text>

      {!hasDeviceModule() ? (
        <Text style={styles.warn}>
          The cue player isn't in this build — chimes use notification sounds
          until the app is rebuilt.
        </Text>
      ) : alarm && alarm.current === 0 ? (
        <Text style={styles.warn}>
          Alarm volume is 0, so chimes will be silent. Turn up alarm volume.
        </Text>
      ) : alarm ? (
        <Text style={styles.meta}>
          Alarm volume {alarm.current}/{alarm.max}
        </Text>
      ) : null}

      <Text style={styles.label}>Master</Text>
      <VolumePills
        value={master}
        color={accent}
        onChange={v => {
          setMasterVolume(v);
          bump();
        }}
      />

      <Text style={styles.label}>Per element · tap ▶ to test</Text>
      {elementVolumes().map(({element, percent}) => {
        const el = ELEMENTS[element];
        return (
          <View key={element} style={styles.elementRow}>
            <Tap
              variant="ghost"
              color={el.color}
              accessibilityLabel={`Test ${el.name} chime`}
              onPress={() => test(element)}
              style={styles.testBtn}>
              <View style={styles.testRow}>
                <ElementGlyph element={el} size={16} />
                <Text style={[styles.testText, {color: el.color}]}>▶</Text>
              </View>
            </Tap>
            <VolumePills
              value={percent}
              color={el.color}
              onChange={v => {
                setElementVolume(element, v);
                bump();
              }}
            />
          </View>
        );
      })}
      {testNote ? <Text style={styles.warn}>{testNote}</Text> : null}

      <Tap
        variant="plain"
        color={accent}
        accessibilityRole="switch"
        accessibilityState={{checked: respectDnd}}
        onPress={() => {
          setRespectDnd(!respectDnd);
          bump();
        }}
        style={styles.toggleTap}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.label}>Respect Do Not Disturb</Text>
            <Text style={styles.meta}>
              {respectDnd
                ? 'On — DND mutes chimes; vibration and the notification still arrive.'
                : 'Off — chimes cut through DND.'}
            </Text>
          </View>
          <Text
            style={[
              styles.toggleState,
              {color: respectDnd ? accent : palette.textDim},
            ]}>
            {respectDnd ? 'ON' : 'OFF'}
          </Text>
        </View>
      </Tap>
    </View>
  );
}

function VolumePills({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (percent: number) => void;
}) {
  return (
    <View style={styles.pills}>
      {VOLUME_STEPS.map(step => {
        const active = value === step;
        return (
          <Tap
            key={step}
            variant="pill"
            color={color}
            accessibilityLabel={step === 0 ? 'Off' : `${step} percent`}
            accessibilityState={{selected: active}}
            onPress={() => onChange(step)}
            style={[
              styles.pill,
              active ? {backgroundColor: color} : styles.pillIdle,
            ]}>
            <Text
              style={[
                styles.pillText,
                {color: active ? palette.bg : palette.textDim},
              ]}>
              {step === 0 ? 'Off' : step}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panel: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
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
  meta: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  warn: {
    ...t.caption,
    color: '#FFD60A',
    marginTop: spacing.sm,
  },
  label: {
    ...t.subtitle,
    color: palette.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  // Five steps share the row evenly so they never wrap on a 360 dp screen.
  pills: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  pillIdle: {
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  testBtn: {
    width: 56,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
    borderRadius: radius.pill,
  },
  testText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  toggleTap: {
    marginTop: spacing.md,
    borderRadius: radius.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCopy: {flex: 1},
  toggleState: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
