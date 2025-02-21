import { prisma } from '@charmverse/core/prisma-client';
import { getSpacesOfUser } from '@root/lib/spaces/getSpacesOfUser';

import type { UserCommunity } from './interfaces';

export async function getUserSpaces({ userId }: { userId: string }): Promise<UserCommunity[]> {
  const [userWorkspaces] = await Promise.all([getSpacesOfUser(userId)]);

  const hiddenItems = (
    await prisma.profileItem.findMany({
      where: {
        type: 'community',
        isHidden: true
      },
      select: {
        id: true
      }
    })
  ).map((profileItem) => profileItem.id);

  const pinnedItems = (
    await prisma.profileItem.findMany({
      where: {
        type: 'community',
        isPinned: true
      },
      select: {
        id: true
      }
    })
  ).map((profileItem) => profileItem.id);

  const charmVerseCommunities: UserCommunity[] = userWorkspaces.map((userWorkspace) => ({
    id: userWorkspace.id,
    isHidden: hiddenItems.includes(userWorkspace.id),
    isPinned: pinnedItems.includes(userWorkspace.id),
    joinDate: userWorkspace.joinDate.toISOString(),
    name: userWorkspace.name,
    logo: userWorkspace.spaceImage,
    walletId: null
  }));

  return charmVerseCommunities;
}
