'use client';

import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

export function Header() {
  useDatadogLogger({ service: 'farcaster-browser' });
  return null;
}
