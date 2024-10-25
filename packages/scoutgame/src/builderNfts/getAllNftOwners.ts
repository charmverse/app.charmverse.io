import { prisma } from '@charmverse/core/prisma-client';

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
        distinct: 'scoutId',
        select: {
          scoutId: true
        }
      }
    }
  });

  return builderNft?.nftSoldEvents.map((ev) => ev.scoutId) || [];
}
