'use client';

import { usePageView } from '@connect-shared/hooks/usePageView';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

import { useRefreshUser } from 'hooks/api/session';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-browser', userId });
  usePageView();
  useRefreshUser();
  return null;
}
