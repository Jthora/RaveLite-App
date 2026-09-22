import type {DisciplineId} from '../domain/exercises/disciplines';

/**
 * Opening Practice from a page over Today. Practice and its circuits
 * belong to Today, so a page asks for it here and goes back; Today opens
 * Practice on the path asked for.
 */
type Listener = (path?: DisciplineId) => void;

const listeners = new Set<Listener>();

export function requestPractice(path?: DisciplineId): void {
  listeners.forEach(listener => listener(path));
}

export function subscribePracticeRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
