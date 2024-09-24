import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';

import { PublicBuilderProfile } from './PublicBuilderProfile';
import { ScoutTab } from './ScoutTab';

export async function PublicProfileTabs({ user, tab }: { user: Scout; tab: string }) {
  if (tab === 'builder') {
    return <PublicBuilderProfile user={user} />;
  }

  return <ScoutTab user={user} />;
}
