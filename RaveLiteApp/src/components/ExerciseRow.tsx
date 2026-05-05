import React, {useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import {Exercise} from '../domain/exercises/types';
import {recordCompletion} from '../domain/journal/recordCompletion';
import {elementOf} from '../theme/elements';
import {palette, radius, spacing, type} from '../theme';
import {pulseHaptic} from '../lib/elementHaptics';

interface Props {
  exercise: Exercise;
  /** Optional callback after a manual completion is logged. */
  onCompleted?: () => void;
}

/** Compact card representing one exercise/drill in a list. */
export const ExerciseRow: React.FC<Props> = ({exercise, onCompleted}) => {
  const el = elementOf(exercise.element);
  // Animated seal: 0 = idle, 1 = sealed peak. Drives an overlay fill +
  // the "Sealed" label opacity. Replaces the previous setTimeout/state
  // toggle so the seal eases out instead of snapping back to idle.
  const sealAnim = useRef(new Animated.Value(0)).current;

  const onDone = () => {
    recordCompletion(exercise, 'manual');
    pulseHaptic(exercise.element, 'seal');
    onCompleted?.();
    Animated.sequence([
      // Quick rise — acknowledgement is immediate.
      Animated.timing(sealAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Slow ebb — the seal lingers, then exhales away.
      Animated.timing(sealAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.in(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.row, {borderLeftColor: el.color}]}>
      {/* Top accent edge — element-color hairline like the hero card,
          gives the card the "etched" quality so it reads as carved
          from the element's deep tone, not just stamped onto a surface. */}
      <View
        pointerEvents="none"
        style={[styles.topEdge, {backgroundColor: el.color, opacity: 0.5}]}
      />
      <View style={styles.head}>
        <Text style={styles.title}>{exercise.name}</Text>
        {/* Dose chip — small lit pill in the element's tint. Reads as a
            label / metadata, not body text. */}
        <View
          style={[
            styles.doseChip,
            {backgroundColor: el.tint, borderColor: el.color + '55'},
          ]}>
          <Text style={[styles.dose, {color: el.accent}]}>{exercise.dose}</Text>
        </View>
      </View>
      <Text style={styles.purpose}>{exercise.purpose}</Text>
      {exercise.targets.length > 0 && (
        <View style={styles.tagRow}>
          {exercise.targets.map(t => (
            <View
              key={t}
              style={[styles.tag, {backgroundColor: el.tint, borderColor: el.color}]}>
              <Text style={[styles.tagText, {color: el.color}]}>{t}</Text>
            </View>
          ))}
        </View>
      )}
      {exercise.cues && exercise.cues.length > 0 && (
        <View style={styles.cues}>
          {exercise.cues.map((c, i) => (
            <Text key={i} style={styles.cue}>
              <Text style={[styles.cueBullet, {color: el.color}]}>·  </Text>
              {c}
            </Text>
          ))}
        </View>
      )}
      <Pressable
        onPress={onDone}
        style={[styles.doneBtn, {borderColor: el.color}]}>
        {/* Animated fill overlay — absolutely positioned so the button's
            layout never reflows. Opacity rises with sealAnim. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.sealFill,
            {backgroundColor: el.color, opacity: sealAnim},
          ]}
        />
        {/* Base label — always rendered, claims the button's width
            so swapping in "Sealed" doesn't reflow. */}
        <Text
          style={[
            styles.doneTxt,
            {color: el.color, opacity: 1},
          ]}>
          {el.verbDone}
        </Text>
        {/* Overlay label — fades in/out with sealAnim, sits on top of
            both the fill and the base label. */}
        <Animated.Text
          style={[
            styles.doneTxt,
            styles.sealLabel,
            {color: palette.bg, opacity: sealAnim},
          ]}>
          ✦  Sealed
        </Animated.Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: palette.surface,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingTop: spacing.md + 2,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  /** Element-color hairline along the top of the card. */
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...type.subtitle,
    color: palette.text,
    flex: 1,
    letterSpacing: -0.2,
  },
  /** Lit pill that hosts the dose so it reads as metadata, not body. */
  doseChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dose: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  purpose: {
    ...type.body,
    color: palette.textDim,
    marginTop: 6,
    lineHeight: 21,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {fontSize: 11, fontWeight: '700', letterSpacing: 0.5},
  cues: {marginTop: spacing.sm + 2},
  cue: {
    ...type.caption,
    color: palette.textDim,
    lineHeight: 19,
    marginBottom: 2,
  },
  cueBullet: {fontWeight: '900'},
  doneBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg + 4,
    overflow: 'hidden',
  },
  /** Element-color fill that rides sealAnim. Clipped by doneBtn's
      borderRadius via overflow:'hidden' on the parent. */
  sealFill: {
    borderRadius: radius.pill,
  },
  /** Absolutely-positioned overlay so it sits centered on top of the
      base verbDone label without affecting button layout. */
  sealLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  doneTxt: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
