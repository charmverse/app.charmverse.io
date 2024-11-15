'use client';

import { createContext, useContext, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// Context to capture the loading state of the dialog so we can use it to show a loading state on the button
// ref: https://github.com/vercel/next.js/discussions/10853
export const DynamicLoadingContext = createContext<Dispatch<SetStateAction<boolean>>>(() => false);

export function LoadingComponent() {
  const setLoading = useContext(DynamicLoadingContext);
  useEffect(() => {
    setLoading(true);
    return () => setLoading(false);
  }, [setLoading]);

  return null;
}
