import { useSyncExternalStore } from "react";

// Simple event emitter for store changes
let version = 0;
const listeners = new Set<() => void>();

export function notifyStoreChange() {
  version++;
  listeners.forEach(l => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return version;
}

/** Hook that re-renders the component whenever the store changes */
export function useStoreRefresh() {
  useSyncExternalStore(subscribe, getSnapshot);
}
