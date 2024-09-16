import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';

import { getStrikesForSeason } from './getStrikesForSeason';

export async function strikeBuilder({
  builderId,
  builderEventId,
  tx
}: {
  builderId: string;
  builderEventId: string;
  tx: PrismaTransactionClient;
}) {
  const builderEvent = await tx.builderEvent.findFirstOrThrow({
    where: {
      id: builderEventId
    },
    select: {
      season: true
    }
  });

  await tx.builderStrike.create({
    data: {
      builderId,
      builderEventId
    }
  });

  let isBanned = false;

  const strikesForSeason = await getStrikesForSeason({ season: builderEvent.season });

  if (strikesForSeason >= 3) {
    await tx.scout.update({
      where: {
        id: builderId
      },
      data: {
        bannedAt: new Date()
      }
    });
    isBanned = true;
  }

  return {
    isBanned
  };
}
