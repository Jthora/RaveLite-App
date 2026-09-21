/**
 * Demo mode: the app, wearing somebody else's life.
 *
 * Built for one job — producing screenshots without photographing the
 * operator's training — and designed around one rule: **the real data is
 * never written to.** It is not exported and put back, which would make
 * every crash a data-loss risk. A separate in-memory store is swapped in
 * front, persistence is bypassed, and the real one sits untouched behind
 * it. A kill, a crash or a flat battery all end the same way: the app
 * restarts on the real data.
 *
 * Entered by a link no menu mentions (`ravelite://demo/on`), because a
 * button for it would be a button somebody presses by accident and then
 * thinks their history is gone.
 */
import {__swapStore} from '../../storage';
import type {KeyValueStore} from '../../storage/types';
import {__resetProfileCache} from '../profile/repository';
import {seedDemo} from './seed';

let on = false;
const listeners = new Set<(on: boolean) => void>();

export function isDemo(): boolean {
  return on;
}

export function subscribeDemo(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A store that keeps everything and persists nothing. */
function throwawayStore(): KeyValueStore {
  const map = new Map<string, string | number | boolean>();
  return {
    getString: k => {
      const v = map.get(k);
      return typeof v === 'string' ? v : undefined;
    },
    getNumber: k => {
      const v = map.get(k);
      return typeof v === 'number' ? v : undefined;
    },
    getBoolean: k => {
      const v = map.get(k);
      return typeof v === 'boolean' ? v : undefined;
    },
    set: (k, v) => {
      map.set(k, v);
    },
    delete: k => {
      map.delete(k);
    },
    keysWithPrefix: p => [...map.keys()].filter(k => k.startsWith(p)),
    clearAll: () => {
      map.clear();
    },
  };
}

function announce(): void {
  for (const listener of listeners) {
    try {
      listener(on);
    } catch (e) {
      console.warn('[demo] listener threw', e);
    }
  }
}

/** Swap in a fictional life. Returns false if already in one. */
export function enterDemo(now: number = Date.now()): boolean {
  if (on) {
    return false;
  }
  const fake = throwawayStore();
  seedDemo(fake, {now});
  __swapStore(fake);
  on = true;
  __resetProfileCache();
  announce();
  return true;
}

/** Put the real one back. Nothing to restore: it was never changed. */
export function exitDemo(): boolean {
  if (!on) {
    return false;
  }
  __swapStore(undefined);
  on = false;
  __resetProfileCache();
  announce();
  return true;
}

/** `ravelite://demo/on`, `…/off`, `…/toggle`. Anything else is ignored. */
export function handleDemoLink(url: string | null | undefined): boolean {
  if (!url || !url.startsWith('ravelite://demo/')) {
    return false;
  }
  const what = url.slice('ravelite://demo/'.length).split(/[?#]/)[0];
  if (what === 'on') {
    return enterDemo();
  }
  if (what === 'off') {
    return exitDemo();
  }
  if (what === 'toggle') {
    return on ? exitDemo() : enterDemo();
  }
  return false;
}

/** Only for tests. */
export function __resetDemo(): void {
  on = false;
  __swapStore(undefined);
}
