/**
 * Custom circuit persistence.
 *
 * Single JSON blob at `circuits.all` — `Record<id, CustomCircuit>`.
 * One blob is fine for the realistic ceiling (~20 circuits) and avoids
 * the indirection of a separate index file. List operations parse the
 * blob each call; with N small the cost is negligible compared to the
 * disk read which the underlying KV store memoises in-process.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {CustomCircuit} from './customTypes';

type Blob = Record<string, CustomCircuit>;

let _seq = 0;
export function newCircuitId(): string {
  _seq = (_seq + 1) % 100_000;
  return `c-${Date.now().toString(36)}-${_seq.toString(36)}`;
}

function readBlob(): Blob {
  const raw = store.getString(KEYS.circuitsAll);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Blob) : {};
  } catch {
    return {};
  }
}

function writeBlob(b: Blob): void {
  store.set(KEYS.circuitsAll, JSON.stringify(b));
}

export function listCircuits(): CustomCircuit[] {
  const b = readBlob();
  return Object.values(b).sort((a, b2) => b2.updatedAt - a.updatedAt);
}

export function loadCircuit(id: string): CustomCircuit | undefined {
  return readBlob()[id];
}

/** Saves the circuit, stamping updatedAt. Returns the persisted version
 *  so callers can reflect the new timestamp in local state. */
export function saveCircuit(c: CustomCircuit): CustomCircuit {
  const stamped = {...c, updatedAt: Date.now()};
  const b = readBlob();
  b[stamped.id] = stamped;
  writeBlob(b);
  return stamped;
}

export function deleteCircuit(id: string): void {
  const b = readBlob();
  if (id in b) {
    delete b[id];
    writeBlob(b);
  }
}

/** Test/QA helper — wipes all custom circuits. */
export function clearAllCircuits(): void {
  writeBlob({});
}

export function makeCircuit(name = 'New circuit'): CustomCircuit {
  const now = Date.now();
  return {
    id: newCircuitId(),
    name,
    legs: [],
    createdAt: now,
    updatedAt: now,
  };
}
