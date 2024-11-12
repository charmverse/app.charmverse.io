import { prisma } from '@charmverse/core/prisma-client';

export type NftSalesData = {
  totalNftsSold: number;
  nftsPaidWithPoints: number;
  nftsPaidWithCrypto: number;
  uniqueHolders: number;
  mintEvents: number;
};

export async function aggregateNftSalesData(): Promise<NftSalesData> {
  const nftsPaidWithPoints = await prisma.nFTPurchaseEvent
    .aggregate({
      where: {
        paidInPoints: true
      },
      _sum: {
        tokensPurchased: true
      }
    })
    .then((data) => data._sum.tokensPurchased || 0);

  const nftsPaidWithCrypto = await prisma.nFTPurchaseEvent
    .aggregate({
      where: {
        paidInPoints: {
          not: true
        }
      },
      _sum: {
        tokensPurchased: true
      }
    })
    .then((data) => data._sum.tokensPurchased || 0);

  const uniqueScoutIds = await prisma.nFTPurchaseEvent
    .findMany({
      distinct: ['scoutId'],
      select: {
        scoutId: true
      }
    })
    .then((data) => ({ _count: { scoutId: data.length } }));

  const mintEvents = await prisma.nFTPurchaseEvent.count();

  return {
    totalNftsSold: nftsPaidWithPoints + nftsPaidWithCrypto,
    nftsPaidWithCrypto,
    nftsPaidWithPoints,
    uniqueHolders: uniqueScoutIds._count.scoutId,
    mintEvents
  };
}
