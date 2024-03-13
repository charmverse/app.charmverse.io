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
  currentUser?: { position: string; totalBalance: number; id: string; avatar: string; username: string };
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

  let currentUser: LeaderBoardData['currentUser'];

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

    const currentUserData = await prisma.charmWallet.findFirst({
      where: { userId: currentUserId, user: { isNot: null } },
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

    currentUser = {
      position: currentUserPositionRes[0]?.position?.toString(),
      id: currentUserData?.user?.id || '',
      username: currentUserData?.user?.username || '',
      avatar: currentUserData?.user?.avatar || '',
      totalBalance: currentUserData?.totalBalance || 0
    };
  }

  return { leaders, currentUser };
}
