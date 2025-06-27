import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { verifyTokenGateMembership } from '@packages/lib/tokenGates/verifyTokenGateMembership';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';

import { updateUsedIdentity } from './updateUsedIdentity';

export type DisconnectWalletRequest = {
  userId: string;
  address: string;
};

export const disconnectWallet = async ({ userId, address }: DisconnectWalletRequest) => {
  if (!address || !userId) {
    throw new InvalidInputError(`Address and userId are required to disconnect your wallet from the user account`);
  }

  const wallet = await prisma.userWallet.findUnique({
    where: {
      userId,
      address
    }
  });

  if (!wallet) {
    throw new MissingDataError(`Wallet not found for user ${userId} and adress ${address}`);
  }

  await prisma.userWallet.delete({
    where: {
      userId,
      address
    }
  });

  const userSpaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId,
      isAdmin: false
    },
    include: {
      user: {
        include: {
          userTokenGates: {
            include: {
              tokenGate: {
                include: {
                  tokenGateToRoles: {
                    include: {
                      role: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  for (const spaceRole of userSpaceRoles) {
    const { removedRoles } = await verifyTokenGateMembership({
      userTokenGates: spaceRole.user.userTokenGates,
      userId,
      spaceId: spaceRole.spaceId,
      canBeRemovedFromSpace: true
    });

    if (removedRoles > 0) {
      log.info(`Removed roles: ${removedRoles}`, { userId, spaceId: spaceRole.spaceId });
    }
  }

  return updateUsedIdentity(userId);
};
