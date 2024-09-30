import { prisma } from '@charmverse/core/prisma-client';

import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';
import { getScoutStats } from 'lib/scouts/getScoutStats';
import type { BasicUserInfo } from 'lib/users/interfaces';
import { BasicUserInfoSelect } from 'lib/users/queries';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({ user }: { user: BasicUserInfo }) {
  const [scout, { allTimePoints, seasonPoints, nftsPurchased }, scoutedBuilders] = await Promise.all([
    prisma.scout.findUniqueOrThrow({
      where: {
        id: user.id
      },
      select: BasicUserInfoSelect
    }),
    getScoutStats(user.id),
    getScoutedBuilders({ scoutId: user.id })
  ]);

  return (
    <PublicScoutProfileContainer
      scout={{
        ...scout,
        githubLogin: scout.githubUser[0]?.login
      }}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      nftsPurchased={nftsPurchased}
      scoutedBuilders={scoutedBuilders}
      userId={user.id}
    />
  );
}
