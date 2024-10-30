import { prisma } from '@charmverse/core/prisma-client';

import { registerBuilderNFT } from '../builderNfts/registerBuilderNFT';
import type { Season } from '../dates';
import { currentSeason } from '../dates';

import { updateBuildersRank } from './updateBuildersRank';

const baseUrl = process.env.DOMAIN as string;

export async function approveBuilder({ builderId, season = currentSeason }: { builderId: string; season?: Season }) {
  if (!baseUrl) {
    throw new Error('DOMAIN is not set');
  }

  // make sure scout exists
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      id: true
    }
  });

  // Register an NFT for the builder
  await registerBuilderNFT({
    imageHostingBaseUrl: baseUrl,
    builderId,
    season
  });

  // Update builder status so they appear in the system
  await prisma.scout.update({
    where: {
      id: builderId
    },
    data: {
      builderStatus: 'approved'
    }
  });

  // Refresh builder ranks
  await updateBuildersRank();
}
