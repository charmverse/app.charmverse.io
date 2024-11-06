'use client';

/* eslint-disable import/no-extraneous-dependencies */
import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';

import { useDatadogLogger } from 'hooks/useDatadogLogger';

import WelcomeModal from './WelcomeModal';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  const [isMounted, setIsMounted] = useState(false);
  useDatadogLogger({ service: 'scoutgame-telegramapp-browser', userId });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Load the Telegram Web App SDK
    if (isMounted) WebApp.ready();
  }, []);

  return <WelcomeModal userId={userId} />;
}
