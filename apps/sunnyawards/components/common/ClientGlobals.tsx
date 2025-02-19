'use client';

import { usePageView } from '@packages/connect-shared/hooks/usePageView';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

import { useDarkTheme } from 'hooks/useDarkTheme';

// instantiate global hooks for the client-side only
export function ClientGlobals({ userId }: { userId?: string }) {
  useDatadogLogger({ service: 'sunnyawards-browser', userId });
  usePageView();
  useDarkTheme();
  return null;
}
