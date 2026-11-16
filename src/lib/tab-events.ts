import { useEffect, useRef, useSyncExternalStore } from 'react';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

/** Fired by the tab bar when you tap the tab you're already on. */
export function emitTabReselect(tab: string) {
  listeners.get(tab)?.forEach((fn) => fn());
}

/**
 * Run `fn` when the user taps this tab's icon while already on it
 * (founder, Nov 2026: glide back to the top). Tabs: index, discover, saved, profile.
 */
export function useTabReselect(tab: string, fn: Listener) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const call = () => ref.current();
    let set = listeners.get(tab);
    if (!set) listeners.set(tab, (set = new Set()));
    set.add(call);
    return () => {
      set.delete(call);
    };
  }, [tab]);
}

// Whether the floating tab bar is tucked away (the Post tab's photo step, like Instagram).
let barHidden = false;
const barListeners = new Set<Listener>();

export function setTabBarHidden(hidden: boolean) {
  if (barHidden === hidden) return;
  barHidden = hidden;
  barListeners.forEach((fn) => fn());
}

export function useTabBarHidden() {
  return useSyncExternalStore(
    (fn) => {
      barListeners.add(fn);
      return () => barListeners.delete(fn);
    },
    () => barHidden,
    () => barHidden,
  );
}
