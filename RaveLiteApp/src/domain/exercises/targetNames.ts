import type {Target} from './types';

/**
 * What a drill's focus is called on screen. The ids are codes — UCS, APT,
 * NoFloor — that nobody outside a physio's office reads. The three
 * corrections use the names the posture page gives them
 * (`profile/flaws.ts`); a test keeps the two in step.
 */
export const TARGET_NAMES: Readonly<Record<Target, string>> = {
  UCS: 'Screen Shoulders',
  Hourglass: 'Held Breath',
  APT: 'Tipped Pelvis',
  'PFT-Pushups': 'Push-up test',
  'PFT-Situps': 'Sit-up test',
  'PFT-Run': 'Run test',
  Core: 'Core',
  Conditioning: 'Conditioning',
  Grip: 'Grip',
  Agility: 'Agility',
  Mobility: 'Mobility',
  Strength: 'Strength',
  Coordination: 'Coordination',
  Flow: 'Flow',
  Breath: 'Breath',
  Presence: 'Presence',
  Hydration: 'Water',
  Fuel: 'Meals',
  NoFloor: 'No floor needed',
  Test: 'Test',
};

export const targetName = (target: Target): string =>
  TARGET_NAMES[target] ?? target;
