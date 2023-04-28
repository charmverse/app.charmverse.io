import { prisma } from '@charmverse/core';

import type { Space } from 'lib/public-api/interfaces';

import { mapSpace } from './createWorkspaceApi';

export type SearchSpacesInput = {
  creatorWalletAddress: string;
};

export async function searchSpaces({ creatorWalletAddress }: SearchSpacesInput): Promise<Space[]> {
  const userWallet = await prisma.userWallet.findFirst({
    where: {
      address: creatorWalletAddress.toLowerCase()
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
