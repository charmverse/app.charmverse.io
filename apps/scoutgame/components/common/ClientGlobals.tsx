'use client';

import { usePageView } from '@connect-shared/hooks/usePageView';

import { useRefreshUserProfiles } from 'hooks/api/session';
import { useDatadogLogger } from 'hooks/useDatadogLogger';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-browser', userId });
  usePageView();
  useRefreshUserProfiles();

  return <WelcomeModal userId={userId} />;
}
