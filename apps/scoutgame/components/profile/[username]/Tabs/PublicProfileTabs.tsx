import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';

import { BuilderTab } from './BuilderTab';
import { ScoutTab } from './ScoutTab';

export async function PublicProfileTabs({ user, tab }: { user: Scout; tab: string }) {
  if (tab === 'builder') {
    return <BuilderTab user={user} />;
  }

  return <ScoutTab user={user} />;
}
