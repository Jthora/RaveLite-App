import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ELEMENTS} from '../theme/elements';
import {palette, radius, spacing, type as t} from '../theme';
import {usePulse} from '../hooks/usePulse';
import {buildCircuit, CircuitLeg} from '../domain/circuit/circuit';
import {recordCompletion} from '../domain/journal/recordCompletion';
import {pulseHaptic} from '../lib/elementHaptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after the final leg seals, before the chamber closes. */
  onCompleted?: () => void;
  /** Optional override — use a custom-authored sequence rather than
   *  the built-in pentagram. Falls back to `buildCircuit()` when absent. */
  legs?: CircuitLeg[];
}

/** Per-leg BPM matches the per-screen BPM in ScreenScaffold. */
const ELEMENT_BPM: Record<string, number> = {
  fire: 96,
  air: 80,
  earth: 50,
  water: 44,
  heart: 60,
};

/**
 * Drill Chamber — RaveLite's signature ritual.
 *
 * Walks the body through Air → Fire → Earth → Water → Heart in a single
 * uninterrupted full-screen ceremony. Each leg:
 *   - Floods the chamber with that element's color
 *   - Pulses a giant glyph at the element's BPM
 *   - Names the drill and shows its first cue
 *   - Counts down silently, then auto-advances
 *
 * User can:
 *   - Tap the glyph to seal early and advance immediately
 *   - Tap "Pause" to halt the timer
 *   - Tap "Leave" to exit (no completions logged for unsealed legs)
 *
 * Completions are journaled per leg as `recordCompletion(ex, 'auto')` —
 * circuit completions — so every element's count grows after a pentagram.
 *
 * Implementation notes:
 *   - Tick-based countdown (200ms interval) to keep the timer ring smooth
 *     without driving every frame from JS.
 *   - Modal (animationType="fade") gives the cross-fade between chamber
 *     and Heart screen for free.
 */
export const CircuitChamber: React.FC<Props> = ({
  visible,
  onClose,
  onCompleted,
  legs,
}) => {
  // Custom legs win; otherwise the built-in pentagram. Memo on the
  // legs identity so editing+re-engaging from the editor produces a
  // fresh circuit, while the default path stays stable across renders.
  const circuit = useMemo<CircuitLeg[]>(
    () => (legs && legs.length > 0 ? legs : buildCircuit()),
    [legs],
  );
  const [legIdx, setLegIdx] = useState(0);
  const [remaining, setRemaining] = useState(circuit[0].durationSec);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const leg = circuit[legIdx];
  const element = ELEMENTS[leg.element];
  const pulse = usePulse(ELEMENT_BPM[leg.element]);

  // Cross-leg flash so the body feels the transition. Triggered on
  // legIdx change.
  const flash = useRef(new Animated.Value(0)).current;

  // Reset state every time the chamber opens.
  useEffect(() => {
    if (!visible) {
      return;
    }
    setLegIdx(0);
    setRemaining(circuit[0].durationSec);
    setPaused(false);
    setDone(false);
  }, [visible, circuit]);

  // Per-leg flash + duration reset.
  useEffect(() => {
    if (done) {
      return;
    }
    setRemaining(circuit[legIdx].durationSec);
    // Tactile threshold: each new leg announces itself in the body.
    pulseHaptic(circuit[legIdx].element, 'enter');
    flash.setValue(1);
    Animated.timing(flash, {
      toValue: 0,
      duration: 700,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [legIdx, circuit, flash, done]);

  // Countdown ticker.
  useEffect(() => {
    if (!visible || paused || done) {
      return;
    }
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 0.2));
    }, 200);
    return () => clearInterval(id);
  }, [visible, paused, done]);

  // Auto-advance / seal when timer hits zero.
  useEffect(() => {
    if (remaining > 0 || done) {
      return;
    }
    sealAndAdvance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const sealAndAdvance = () => {
    // Journal this leg as a circuit completion.
    recordCompletion(leg.exercise, 'auto');
    // Element-signature seal haptic.
    pulseHaptic(leg.element, 'seal');
    if (legIdx < circuit.length - 1) {
      setLegIdx(legIdx + 1);
    } else {
      setDone(true);
      onCompleted?.();
    }
  };

  const onLeave = () => {
    setDone(false);
    onClose();
  };

  // Pulse mappings for the giant glyph.
  const glyphScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.12],
  });
  const glyphOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  // Timer ring fill (linear bar at the bottom of the glyph).
  const fillRatio = 1 - remaining / leg.durationSec;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onLeave}>
      <SafeAreaView style={[styles.root, {backgroundColor: element.deep}]}>
        {/* Element flood — deep at ~0.55 alpha behind everything. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {backgroundColor: element.color, opacity: 0.12},
          ]}
        />

        {/* Header: leg counter + leave. */}
        <View style={styles.header}>
          <Text style={[styles.legCount, {color: element.color}]}>
            {done ? 'Complete' : `${legIdx + 1} / ${circuit.length}`}
          </Text>
          <Pressable onPress={onLeave} hitSlop={12}>
            <Text style={[styles.leave, {color: element.color}]}>Leave</Text>
          </Pressable>
        </View>

        {done ? (
          <FinaleView onClose={onLeave} />
        ) : (
          <View style={styles.body}>
            {/* Cross-leg flash overlay. */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: element.color,
                  // Peak at 0.28 (was 0.45) — flash signals the transition
                  // without washing out the element-colored UI beneath it.
                  opacity: flash.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.28],
                  }),
                },
              ]}
            />

            <Text style={[styles.eyebrow, {color: element.color}]}>
              {element.name.toUpperCase()} · {element.domain.toUpperCase()}
            </Text>

            <Pressable
              onPress={sealAndAdvance}
              style={styles.glyphPress}
              hitSlop={24}>
              <Animated.Text
                style={[
                  styles.glyph,
                  {
                    color: element.color,
                    opacity: glyphOpacity,
                    transform: [{scale: glyphScale}],
                  },
                ]}>
                {element.glyph}
              </Animated.Text>
            </Pressable>

            <Text style={styles.drillName}>{leg.exercise.name}</Text>
            {/* palette.text (white) ensures legibility at any flash peak
                regardless of which element color is flooding the screen. */}
            <Text style={[styles.cue, {color: palette.text}]}>
              {leg.exercise.cues?.[0] ?? leg.exercise.name}
            </Text>

            {/* Timer track. */}
            <View
              style={[styles.track, {backgroundColor: element.color + '22'}]}>
              <View
                style={[
                  styles.trackFill,
                  {
                    backgroundColor: element.color,
                    width: `${fillRatio * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.timer, {color: element.color}]}>
              {Math.ceil(remaining)}s
            </Text>

            <View style={styles.controls}>
              <Pressable
                onPress={() => setPaused(p => !p)}
                style={[styles.btn, {borderColor: element.color}]}>
                <Text style={[styles.btnText, {color: element.color}]}>
                  {paused ? 'Resume' : 'Pause'}
                </Text>
              </Pressable>
              <Pressable
                onPress={sealAndAdvance}
                style={[
                  styles.btn,
                  {backgroundColor: element.color, borderColor: element.color},
                ]}>
                <Text style={[styles.btnText, {color: palette.bg}]}>
                  Done · next
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const FinaleView: React.FC<{onClose: () => void}> = ({onClose}) => {
  const heartPulse = usePulse(60);
  const scale = heartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.18],
  });
  return (
    <View style={styles.body}>
      <Text style={[styles.eyebrow, {color: ELEMENTS.heart.accent}]}>
        CIRCUIT COMPLETE
      </Text>
      <Animated.Text
        style={[
          styles.glyph,
          {color: ELEMENTS.heart.color, transform: [{scale}]},
        ]}>
        ✦
      </Animated.Text>
      <Text style={styles.finaleTitle}>All five elements done.</Text>
      <Text style={styles.finaleBody}>
        All five legs are logged. Run the circuit again any time.
      </Text>
      <Pressable
        onPress={onClose}
        style={[
          styles.btn,
          {
            backgroundColor: ELEMENTS.heart.color,
            borderColor: ELEMENTS.heart.color,
            marginTop: spacing.xl,
            alignSelf: 'center',
            paddingHorizontal: spacing.xl,
          },
        ]}>
        <Text style={[styles.btnText, {color: palette.bg}]}>Close</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  legCount: {fontSize: 12, fontWeight: '800', letterSpacing: 3},
  leave: {fontSize: 12, fontWeight: '800', letterSpacing: 2, opacity: 0.8},
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: spacing.xl,
  },
  glyphPress: {alignItems: 'center', justifyContent: 'center'},
  glyph: {
    fontSize: 180,
    lineHeight: 196,
    fontWeight: '300',
    textAlign: 'center',
  },
  drillName: {
    ...t.title,
    color: palette.text,
    marginTop: spacing.xl,
    fontSize: 30,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  cue: {
    ...t.body,
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    maxWidth: 580,
    lineHeight: 26,
    opacity: 0.85,
  },
  track: {
    height: 3,
    width: '70%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  trackFill: {height: '100%'},
  timer: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 140,
  },
  btnText: {fontWeight: '800', letterSpacing: 1, fontSize: 13},
  finaleTitle: {
    ...t.display,
    color: palette.text,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  finaleBody: {
    ...t.body,
    color: palette.textDim,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 480,
    lineHeight: 24,
  },
});
