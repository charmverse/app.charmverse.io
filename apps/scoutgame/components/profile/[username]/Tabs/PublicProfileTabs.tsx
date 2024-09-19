import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { Suspense } from 'react';

import { LoadingComponent } from 'components/layout/Loading/LoadingComponent';

import { BuilderTab } from './BuilderTab';
import { ScoutTab } from './ScoutTab';

export async function PublicProfileTabs({ user, tab }: { user: Scout; tab: string }) {
  if (tab === 'builder') {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <BuilderTab user={user} />
      </Suspense>
    );
  }

  return <ScoutTab user={user} />;
}
