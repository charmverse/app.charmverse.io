import 'server-only';

import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { AppProviders as AppProvidersBase } from '@packages/scoutgame-ui/providers/AppProviders';
import type { ReactNode } from 'react';

export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return <AppProvidersBase user={user}>{children}</AppProvidersBase>;
}
