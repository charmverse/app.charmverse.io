import { prisma } from '@charmverse/core/prisma-client';

const TOP_COUNT = 20;

export type LeaderBoardUser = {
  id: string;
  totalBalance: number;
  username: string;
  avatar: string;
};

export type LeaderBoardData = {
  leaders: LeaderBoardUser[];
  currentUserPosition?: string;
};

export async function getLeaderBoard(currentUserId?: string | null) {
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

  const leaders = topWallets.map((w) => ({
    totalBalance: w.totalBalance,
    id: w.user?.id,
    username: w.user?.username,
    avatar: w.user?.avatar
  })) as LeaderBoardUser[];

  let currentUserPosition: string | undefined;

  if (currentUserId) {
    // query current user position in the leaderboard using ROW_NUMBER
    const currentUserPositionRes: [{ position: bigint }] = await prisma.$queryRaw`
      SELECT row_number as position FROM
        (SELECT *,
         ROW_NUMBER() OVER (
          ORDER BY "CharmWallet"."totalBalance" DESC)
          FROM "public"."CharmWallet"
        )
      "CharmWallet"
      WHERE "CharmWallet"."userId" = ${currentUserId}::UUID
      LIMIT 1;
  `;

    currentUserPosition = currentUserPositionRes[0]?.position?.toString();
  }

  return { leaders, currentUserPosition: currentUserPosition || '-' };
}
