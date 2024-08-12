'use client';

import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

export function GlobalComponent() {
  useDatadogLogger({ service: 'farcaster-browser' });
  return null;
}
