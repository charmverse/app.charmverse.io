import { prisma } from '@charmverse/core';

import { getAllOrganizations, getProfile } from 'lib/deepdao/client';
import log from 'lib/log';
import { getSpacesOfUser } from 'lib/spaces/getSpacesOfUser';
import { isTruthy } from 'lib/utilities/types';

import type { UserCommunity } from './interfaces';

export async function getOrgs({ userId, apiToken }: { userId: string; apiToken?: string }) {
  const wallets = await prisma.userWallet.findMany({
    where: {
      userId
    }
  });

  const profiles = (
    await Promise.all(
      wallets.map(async ({ address }) => {
        try {
          const profile = await getProfile(address, apiToken);
          if (!profile) return null;
          return {
            ...profile,
            address
          };
        } catch (error) {
          log.error('Error calling DEEP DAO API', error);
          return null;
        }
      })
    )
  ).filter(isTruthy);

  const [allOrganizations, userWorkspaces] = await Promise.all([
    getAllOrganizations(apiToken),
    getSpacesOfUser(userId)
  ]);

  const daoLogos = allOrganizations.data.resources.reduce<Record<string, string | null>>((logos, org) => {
    logos[org.organizationId] = org.logo;
    return logos;
  }, {});

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

  const deepDaoCommunities: UserCommunity[] = Object.values(profiles)
    .map((profile) =>
      profile.data.organizations.map((org) => ({
        joinDate: '',
        id: org.organizationId,
        isHidden: hiddenItems.includes(org.organizationId),
        isPinned: pinnedItems.includes(org.organizationId),
        name: org.name,
        // sometimes the logo is just a filename, do some basic validation
        logo: daoLogos[org.organizationId]?.includes('http') ? daoLogos[org.organizationId] : null,
        walletId: wallets.find((wallet) => wallet.address === profile.address)?.id ?? null
      }))
    )
    .flat();

  const filteredDeepdaoCommunities = deepDaoCommunities.filter((org) => org.id);

  if (deepDaoCommunities.length !== filteredDeepdaoCommunities.length) {
    // Deepdao API returned some organization with id
    log.info(`[deepdao profiles]`, profiles);
  }

  const charmVerseCommunities: UserCommunity[] = userWorkspaces.map((userWorkspace) => ({
    id: userWorkspace.id,
    isHidden: hiddenItems.includes(userWorkspace.id),
    isPinned: pinnedItems.includes(userWorkspace.id),
    joinDate: userWorkspace.spaceRoles.find((spaceRole) => spaceRole.userId === userId)?.createdAt.toISOString(),
    name: userWorkspace.name,
    logo: userWorkspace.spaceImage,
    walletId: null
  }));

  return {
    deepdaoCommunities: filteredDeepdaoCommunities,
    charmverseCommunities: charmVerseCommunities,
    profiles
  };
}
