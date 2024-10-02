import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

export async function getAllNftOwners({ builderId, season }: { builderId: string; season: string }): Promise<string[]> {
  const builderNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season: {
        season,
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

  return arrayUtils.uniqueValues(builderNft?.nftSoldEvents.map((ev) => ev.scoutId) ?? []) || [];
}
