/**
 * Asking for the setup walkthrough from somewhere that cannot show it.
 *
 * `SetupFlow` is a full-screen Modal rendered at the app root. Settings
 * is also a Modal, and this app has learned the hard way that a modal
 * over a modal breaks Back and touch handling on Android — so Settings
 * cannot simply render one.
 *
 * Instead it asks. Settings closes itself, the root notices, and the
 * walkthrough opens with nothing underneath it.
 */
export type SetupReason =
  /** Walk the same questions, pre-filled with what is already set. */
  | 'revisit'
  /** Wiped first, so it behaves exactly as a new install would. */
  | 'fresh';

let pending: SetupReason | undefined;
const listeners = new Set<(reason: SetupReason | undefined) => void>();

export function requestSetup(reason: SetupReason): void {
  pending = reason;
  for (const listener of listeners) {
    try {
      listener(reason);
    } catch (e) {
      console.warn('[setup] listener threw', e);
    }
  }
}

export function pendingSetup(): SetupReason | undefined {
  return pending;
}

export function clearSetupRequest(): void {
  pending = undefined;
}

export function subscribeSetupRequest(
  listener: (reason: SetupReason | undefined) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
