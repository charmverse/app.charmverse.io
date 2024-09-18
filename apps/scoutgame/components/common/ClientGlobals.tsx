'use client';

import { usePageView } from '@connect-shared/hooks/usePageView';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-browser', userId });
  usePageView();
  return null;
}
