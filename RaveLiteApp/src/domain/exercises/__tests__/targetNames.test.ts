import {FLAWS} from '../../profile/flaws';
import {targetName} from '../targetNames';

it('calls a correction what the posture page calls it', () => {
  for (const flaw of FLAWS) {
    expect(targetName(flaw.target)).toBe(flaw.name);
  }
});

it('shows no code on screen', () => {
  expect(targetName('NoFloor')).toBe('No floor needed');
  expect(targetName('PFT-Pushups')).toBe('Push-up test');
});
