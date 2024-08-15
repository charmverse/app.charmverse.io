'use client';

import { useDarkTheme } from '@connect-shared/hooks/useDarkTheme';
import { usePageView } from '@connect-shared/hooks/usePageView';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';

// instantiate global hooks for the client-side only
export function ClientGlobal({ user }: { user: LoggedInUser | null }) {
  useDatadogLogger({ service: 'sunnyawards-browser', userId: user?.id });
  usePageView();
  useDarkTheme();
  return null;
}
