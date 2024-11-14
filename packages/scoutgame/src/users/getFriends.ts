import { prisma } from '@charmverse/core/prisma-client';
import { BasicUserInfoSelect } from '@packages/scoutgame/users/queries';

export async function getFriends(userId?: string) {
  if (!userId) {
    return [];
  }

  const friends = await prisma.referralCodeEvent.findMany({
    where: {
      referrerId: userId
    },
    include: {
      referee: {
        include: BasicUserInfoSelect
      }
    }
  });

  return friends.map((friend) => friend.referee);
}
