'use client';

import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

import { usePageView } from 'hooks/usePageView';

export function GlobalComponent() {
  useDatadogLogger({ service: 'farcaster-browser' });
  usePageView();
  return null;
}
