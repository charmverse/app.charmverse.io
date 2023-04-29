import { prisma } from '@charmverse/core';

import type { Space } from 'lib/public-api/interfaces';

import { mapSpace } from './createWorkspaceApi';

export type SearchSpacesInput = {
  userWallet: string;
};

export async function searchSpaces({ userWallet: userWalletAddress }: SearchSpacesInput): Promise<Space[]> {
  const userWallet = await prisma.userWallet.findFirst({
    where: {
      address: userWalletAddress.toLowerCase()
    },
    include: {
      user: {
        include: {
          spacesCreated: true
        }
      }
    }
  });

  if (userWallet) {
    return userWallet.user.spacesCreated.map((space) => mapSpace(space));
  }
  return [];
}
