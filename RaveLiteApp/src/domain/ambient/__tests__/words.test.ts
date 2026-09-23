/**
 * The words in the notification shade, held still.
 *
 * These three files write the strings a person sees most and reads least
 * carefully: the permanent notification that sits in the shade every
 * waking hour, the lock-screen title and body of every chime, and the
 * channel names Android prints in its own settings. They are also the
 * furthest from anyone's eye while developing — nothing on screen in the
 * app changes when they drift — which is how "Ambient pulses active"
 * survived to become the most-seen string in the product.
 *
 * So: the codebase may call them pulses. A person is told "chime",
 * because that is the word every screen in the app uses.
 *
 * This reads source text rather than calling the functions, because the
 * functions talk to notifee and the point here is the words, not the
 * plumbing. It only inspects string literals, so identifiers like
 * `pulseId` and `pulsePayload` are left alone.
 */
import {readFileSync} from 'fs';
import {join} from 'path';

import {describe, expect, it} from '@jest/globals';

const ROOT = join(__dirname, '..', '..', '..');

const FILES = [
  'domain/ambient/foregroundService.ts',
  'domain/ambient/pulsePayload.ts',
  'domain/reminders/notifeeScheduler.ts',
];

/** Words retired from anything a person reads. */
const RETIRED = [/\bambient\b/i, /\bpulses?\b/i, /\breminders?\b/i];

/**
 * Source with the parts that are not prose removed: comments, which may
 * say "pulse" all they like, and import paths, which are file names —
 * `'../reminders/types'` is not something anybody reads.
 */
function prosePartsOf(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^\s*(import|export)\s[^;]*;/gm, '');
}

/** Every string literal left, template literals included. */
function stringLiterals(src: string): string[] {
  const found = src.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) ?? [];
  return (
    found
      // A template's `${...}` holds code, not prose.
      .map(s => s.replace(/\$\{[^}]*\}/g, ' '))
      // Module paths, and ids like `ambient.fgs.v1` — the channel id,
      // which must never change or Android orphans the old channel.
      // Prose has a space in it; an identifier does not.
      .filter(s => !/^['"`][./]/.test(s))
      .filter(s => /\s/.test(s.slice(1, -1).trim()))
  );
}

describe('the words a person reads', () => {
  for (const file of FILES) {
    it(`${file} says chime, not pulse`, () => {
      const literals = stringLiterals(
        prosePartsOf(readFileSync(join(ROOT, file), 'utf8')),
      );
      const offenders = literals.filter(s => RETIRED.some(r => r.test(s)));
      expect(offenders).toEqual([]);
    });
  }

  it('the permanent notification says what it is and what to do', () => {
    const src = readFileSync(join(ROOT, FILES[0]), 'utf8');
    expect(src).toContain('Chimes are on. Tap to open.');
  });
});
