import {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing} from 'react-native';

import {sineStops} from '../lib/aliveMath';

/**
 * The pulse — the app's heartbeat, in code.
 *
 * Every visible glyph that wants to *live* subscribes to a BPM
 * oscillator. The value smoothly oscillates 0 → 1 → 0 once per beat.
 *
 * Implementation: ONE linear native-driver timing loop (phase 0 → 1)
 * shaped into a sine by a sampled interpolation. `Animated.sequence`
 * can't run on the native driver, so the old up/down sequence restarted
 * through JS every half-beat and stuttered whenever JS was busy; this
 * loop never touches JS after `start()`.
 *
 *   bpm: optional override. Heart pulses at the user's training BPM
 *        (later); element screens borrow the pulse but multiply by a
 *        characteristic factor (Fire faster, Water slower) — that
 *        modulation lives in the consumer, not here.
 *
 * Returns an animated node in [0, 1]. Map it to scale/opacity/etc.
 */
const BREATH_SHAPE = sineStops(16);

export function usePulse(
  bpm = 60,
  /** False holds it still: reduce motion, or the Still setting. */
  moving = true,
): Animated.AnimatedInterpolation<number> {
  // useRef so the value survives re-renders without restarting the loop.
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!moving) {
      phase.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: (60 / bpm) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [bpm, phase, moving]);

  return useMemo(() => phase.interpolate(BREATH_SHAPE), [phase]);
}
