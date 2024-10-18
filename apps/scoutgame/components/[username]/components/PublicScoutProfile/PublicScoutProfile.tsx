import { prisma } from '@charmverse/core/prisma-client';

import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';
import { getScoutStats } from 'lib/scouts/getScoutStats';
import { getCachedUserFromSession as getUserFromSession } from 'lib/session/getUserFromSession';
import type { BasicUserInfo } from 'lib/users/interfaces';
import { BasicUserInfoSelect } from 'lib/users/queries';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({ publicUser }: { publicUser: BasicUserInfo }) {
  const [scout, { allTimePoints, seasonPoints, nftsPurchased }, scoutedBuilders, user] = await Promise.all([
    prisma.scout.findUniqueOrThrow({
      where: {
        id: publicUser.id
      },
      select: BasicUserInfoSelect
    }),
    getScoutStats(publicUser.id),
    getScoutedBuilders({ scoutId: publicUser.id }),
    getUserFromSession()
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
      userId={user?.id}
    />
  );
}
