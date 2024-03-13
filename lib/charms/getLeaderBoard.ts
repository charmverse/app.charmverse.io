import { prisma } from '@charmverse/core/prisma-client';

const TOP_COUNT = 20;

export type LeaderBoardUser = {
  id: string;
  totalBalance: number;
  username: string;
  avatar: string;
};

export async function getLeaderBoard() {
  const topWallets = await prisma.charmWallet.findMany({
    where: { totalBalance: { gt: 0 }, user: { isNot: null } },
    orderBy: [{ totalBalance: 'desc' }, { user: { createdAt: 'asc' } }],
    take: TOP_COUNT,
    select: {
      totalBalance: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  });

  return topWallets.map((w) => ({
    totalBalance: w.totalBalance,
    id: w.user?.id,
    username: w.user?.username,
    avatar: w.user?.avatar
  })) as LeaderBoardUser[];
}
