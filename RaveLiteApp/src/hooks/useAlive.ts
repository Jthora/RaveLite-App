import {useEffect, useState} from 'react';

import {
  aliveValues,
  getMotionBudget,
  getWash,
  releaseBreath,
  retainBreath,
  subscribeAlive,
} from '../lib/aliveClock';
import type {MotionBudget} from '../lib/aliveMath';

/** The current motion budget; re-renders when the motion mode changes. */
export function useMotionBudget(): MotionBudget {
  const [budget, setBudget] = useState(getMotionBudget);
  useEffect(() => subscribeAlive(() => setBudget(getMotionBudget())), []);
  return budget;
}

/**
 * The shared breathing clock, for a component that renders it. Keeps the
 * loop alive only while such a component is mounted and breathing is on.
 */
export function useAliveBreath() {
  const budget = useMotionBudget();
  const breathing = budget.breathMax > 0;
  useEffect(() => {
    if (!breathing) {
      return undefined;
    }
    retainBreath();
    return releaseBreath;
  }, [breathing]);
  return {
    phase: aliveValues.phase,
    energy: aliveValues.energy,
    kick: aliveValues.kick,
    budget,
  };
}

/** The wash value plus its current color and peak opacity. */
export function useAliveWash() {
  const [wash, setWash] = useState(getWash);
  useEffect(() => subscribeAlive(() => setWash(getWash())), []);
  return {value: aliveValues.wash, color: wash.color, peak: wash.peak};
}
