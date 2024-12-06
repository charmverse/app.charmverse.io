import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function getAllNftOwners({
  builderId,
  season,
  nftType
}: {
  builderId: string;
  season: string;
  nftType: BuilderNftType;
}): Promise<string[]> {
  const builderNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        season,
        builderId,
        nftType
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
