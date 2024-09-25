import { prisma } from '@charmverse/core/prisma-client';
import { notFound } from 'next/navigation';

import { getScoutedBuilders } from 'lib/scouts/getScoutedBuilders';
import { getScoutStats } from 'lib/scouts/getScoutStats';

import { PublicScoutProfileContainer } from './PublicScoutProfileContainer';

export async function PublicScoutProfile({ scoutId, tab }: { scoutId: string; tab: string }) {
  const scout = await prisma.scout.findUnique({
    where: {
      id: scoutId
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      avatar: true,
      githubUser: {
        select: {
          id: true,
          login: true
        }
      }
    }
  });

  if (!scout) {
    notFound();
  }

  const { allTimePoints, seasonPoints, nftsPurchased, buildersScouted } = await getScoutStats(scout.id);

  const scoutedBuilders = await getScoutedBuilders({ scoutId: scout.id });

  return (
    <PublicScoutProfileContainer
      scout={{
        id: scout.id,
        displayName: scout.displayName,
        username: scout.username,
        avatar: scout.avatar,
        bio: scout.bio,
        githubLogin: scout.githubUser[0]?.login
      }}
      tab={tab}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      buildersScouted={buildersScouted}
      nftsPurchased={nftsPurchased}
      scoutedBuilders={scoutedBuilders}
    />
  );
}
