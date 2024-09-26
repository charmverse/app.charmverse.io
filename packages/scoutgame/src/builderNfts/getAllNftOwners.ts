import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

import { currentSeason } from './constants';

export async function getAllNftOwners({ builderId }: { builderId: string }): Promise<string[]> {
  const builderNft = await prisma.builderNft.findUniqueOrThrow({
    where: {
      builderId_season: {
        season: currentSeason,
        builderId
      }
    },
    select: {
      nftSoldEvents: {
        select: {
          scoutId: true
        }
      }
    }
  });

  return arrayUtils.uniqueValues(builderNft.nftSoldEvents.map((ev) => ev.scoutId));
}
