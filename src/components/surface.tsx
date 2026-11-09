import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { PLAIN_SURFACE, type Surface } from '@/lib/theme';

const SurfaceContext = createContext<Surface>(PLAIN_SURFACE);

/** Tells everything inside which ground it sits on (a niche flood or plain white). */
export function SurfaceProvider({ value, children }: { value: Surface; children: ReactNode }) {
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>;
}

export function useSurface() {
  return useContext(SurfaceContext);
}

/** Builds a stylesheet from the current surface, so one set of styles works on white and on a flood. */
export function useSurfaceStyles<T>(make: (s: Surface) => T): T {
  const surface = useSurface();
  return useMemo(() => make(surface), [surface, make]);
}
