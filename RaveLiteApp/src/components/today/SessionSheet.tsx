/**
 * SessionSheet — time a session and log it: pick what you're doing, Start,
 * then Stop and log when you're done. Videos play on another device;
 * RaveLite only keeps the time. While a session runs, `SessionBanner`
 * shows it at the top of Today.
 */
import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../Tap';
import {clockHM} from '../../domain/conditions/format';
import {formatDuration} from '../../domain/training/grading';
import {getMetric} from '../../domain/training/repository';
import {
  MIN_SESSION_SECONDS,
  SESSION_KIND_IDS,
  discardSession,
  getRunningSession,
  sessionSeconds,
  startSession,
  stopSession,
  subscribeSession,
  type RunningSession,
} from '../../domain/training/session';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** The running session, kept current, with a clock ticking each second. */
function useRunningSession(): {session?: RunningSession; now: number} {
  const [session, setSession] = useState(getRunningSession);
  const [now, setNow] = useState(Date.now);
  useEffect(() => subscribeSession(() => setSession(getRunningSession())), []);
  useEffect(() => {
    if (!session) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);
  return {session, now};
}

const labelOf = (kindId: string) => getMetric(kindId)?.label ?? 'Session';

export function SessionSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {session, now} = useRunningSession();
  const [kindId, setKindId] = useState(SESSION_KIND_IDS[0]);
  const accent = ELEMENTS.heart.accent;
  const kind = getMetric(kindId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Session</Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        {session ? (
          <View style={styles.body}>
            <Text style={styles.eyebrow}>{labelOf(session.kindId)}</Text>
            <Text testID="session-clock" style={styles.clock}>
              {formatDuration(sessionSeconds(session, now))}
            </Text>
            <Text style={styles.caption}>
              Started {clockHM(session.startedAt)}. The clock keeps running if
              you close the app.
            </Text>
            <Tap
              testID="session-stop"
              variant="solid"
              color={accent}
              onPress={() => {
                stopSession();
                onClose();
              }}
              accessibilityRole="button"
              style={styles.primary}>
              <Text style={styles.primaryText}>Stop and log</Text>
            </Tap>
            <Tap
              testID="session-discard"
              variant="ghost"
              color={palette.textDim}
              onPress={discardSession}
              accessibilityRole="button"
              style={styles.secondary}>
              <Text style={styles.secondaryText}>Discard</Text>
            </Tap>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.eyebrow}>What are you doing?</Text>
            <View style={styles.kinds}>
              {SESSION_KIND_IDS.map(id => {
                const on = id === kindId;
                return (
                  <Tap
                    key={id}
                    testID={`session-kind-${id}`}
                    variant="ghost"
                    color={on ? accent : palette.textDim}
                    onPress={() => setKindId(id)}
                    accessibilityRole="radio"
                    accessibilityState={{selected: on}}
                    style={styles.kind}>
                    <Text style={[styles.kindText, on && {color: accent}]}>
                      {labelOf(id)}
                    </Text>
                  </Tap>
                );
              })}
            </View>
            {kind?.notes ? (
              <Text style={styles.caption}>{kind.notes}</Text>
            ) : null}
            <Tap
              testID="session-start"
              variant="solid"
              color={accent}
              onPress={() => startSession(kindId)}
              accessibilityRole="button"
              style={styles.primary}>
              <Text style={styles.primaryText}>Start</Text>
            </Tap>
            <Text style={styles.caption}>
              Videos play on your other device; RaveLite keeps the time. Under{' '}
              {MIN_SESSION_SECONDS / 60} minute isn't logged.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/** A slim line at the top of Today while a session runs; tap to stop it. */
export function SessionBanner({onPress}: {onPress: () => void}) {
  const {session, now} = useRunningSession();
  if (!session) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  const label = labelOf(session.kindId);
  const clock = formatDuration(sessionSeconds(session, now));
  return (
    <Tap
      testID="session-banner"
      variant="ghost"
      color={accent}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} running, ${clock}. Open to stop`}
      style={styles.banner}>
      <View style={styles.bannerRow}>
        <View style={[styles.dot, {backgroundColor: accent}]} />
        <Text style={styles.bannerText} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.bannerClock, {color: accent}]}>{clock}</Text>
        <Text style={styles.bannerAction}>Stop ›</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    ...t.title,
  },
  close: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kind: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  kindText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  clock: {
    fontSize: 56,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  primary: {
    minHeight: 56,
    borderRadius: radius.pill,
  },
  primaryText: {
    ...t.subtitle,
    color: palette.bg,
  },
  secondary: {
    minHeight: 48,
    borderRadius: radius.pill,
  },
  secondaryText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  banner: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
    flex: 1,
  },
  bannerClock: {
    ...t.subtitle,
    fontVariant: ['tabular-nums'],
  },
  bannerAction: {
    ...t.caption,
    color: palette.textDim,
  },
});
