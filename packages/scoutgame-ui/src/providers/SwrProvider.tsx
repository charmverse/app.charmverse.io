'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError(err) {
          return err.status >= 500;
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}
