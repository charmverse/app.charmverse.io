import { prisma } from '@charmverse/core/prisma-client';
import type { SpaceApiResponse } from 'lib/public-api/interfaces';

import { mapSpace } from './createWorkspaceApi';

export type SearchSpacesInput = {
  userWallet: string;
};

export async function searchSpaces({ userWallet: userWalletAddress }: SearchSpacesInput): Promise<SpaceApiResponse[]> {
  const userWallet = await prisma.userWallet.findFirst({
    where: {
      address: userWalletAddress.toLowerCase()
    },
    include: {
      user: {
        include: {
          spaceRoles: {
            include: {
              space: true
            }
          }
        }
      }
    }
  });

  if (userWallet) {
    return userWallet.user.spaceRoles.map(({ space }) => mapSpace(space));
  }
  return [];
}
