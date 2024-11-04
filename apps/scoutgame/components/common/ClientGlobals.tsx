'use client';

import { useDatadogLogger } from 'hooks/useDatadogLogger';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'scoutgame-browser', userId });

  return <WelcomeModal userId={userId} />;
}
