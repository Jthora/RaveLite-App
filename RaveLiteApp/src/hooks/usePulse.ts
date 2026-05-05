import {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';

/**
 * The pulse — the app's heartbeat, in code.
 *
 * Every visible glyph that wants to *live* subscribes to a shared
 * 60-BPM oscillator. One full cycle = 1000ms; the value smoothly
 * oscillates 0 → 1 → 0 with a sinusoidal feel via easing on both
 * legs. Native-driven so the JS thread can be busy without dropping
 * the heartbeat.
 *
 *   bpm: optional override. Heart pulses at the user's training BPM
 *        (later); element screens borrow the pulse but multiply by a
 *        characteristic factor (Fire faster, Water slower) — that
 *        modulation lives in the consumer, not here.
 *
 * Returns an Animated.Value in [0, 1]. Map it to scale/opacity/etc.
 */
export function usePulse(bpm = 60): Animated.Value {
  // useRef so the value survives re-renders without restarting the loop.
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const periodMs = (60 / bpm) * 1000;
    const half = periodMs / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: half,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: half,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bpm, value]);

  return value;
}
