import type {
  SpaceRoleToRole,
  TokenGate as PrismaTokenGate,
  TokenGateToRole,
  UserTokenGate
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getLogger } from '@packages/core/log';
import { isTruthy } from '@packages/utils/types';

import type { TokenGateWithRoles } from './interfaces';
import { validateTokenGate } from './validateTokenGate';

const log = getLogger('tg-verification');

type InitialTokenGateWithRoles = {
  tokenGate:
    | (PrismaTokenGate & {
        tokenGateToRoles?: TokenGateToRole[];
      })
    | null;
};
type UserTokenGateProp = UserTokenGate & InitialTokenGateWithRoles;

type VerifyTokenGateMembershipProps = {
  userTokenGates: UserTokenGateProp[];
  userId: string;
  spaceId: string;
  canBeRemovedFromSpace: boolean;
  userSpaceRoles?: SpaceRoleToRole[];
};

export async function verifyTokenGateMembership({
  userTokenGates,
  userSpaceRoles,
  userId,
  spaceId,
  canBeRemovedFromSpace
}: VerifyTokenGateMembershipProps): Promise<{ verified: boolean; removedRoles: number }> {
  if (!userTokenGates.length) {
    return { verified: true, removedRoles: 0 };
  }

  const wallets = await prisma.userWallet.findMany({ where: { userId } });

  const tokenGateVerificationPromises = userTokenGates.map(async (userTokenGate) => {
    const { tokenGate: tokenGateWithRoles, id, grantedRoles } = userTokenGate;

    if (!tokenGateWithRoles) {
      return { id, isVerified: false, roleIds: grantedRoles };
    }

    const values = await Promise.all(
      wallets.map(async (w) => validateTokenGate(tokenGateWithRoles as any as TokenGateWithRoles, w.address))
    );

    return {
      id: tokenGateWithRoles.id,
      isVerified: values.some((v) => !!v),
      roleIds: tokenGateWithRoles.tokenGateToRoles?.map((r) => r.roleId) || []
    };
  });

  const tokenGateVerificationResults = await Promise.allSettled(tokenGateVerificationPromises).then((_r) =>
    _r
      .map((r) => {
        if (r.status === 'fulfilled') {
          return r.value;
        }
        if (r.status === 'rejected') {
          log.error('Error verifying token gate membership', { error: r.reason });
        }
        return undefined;
      })
      .filter(isTruthy)
  );

  const validTokenGates = tokenGateVerificationResults.filter((r) => r.isVerified);
  const invalidTokenGates = tokenGateVerificationResults.filter((r) => !r.isVerified);

  let validRoleIds: string[] = [];
  validTokenGates.forEach((tg) => {
    validRoleIds = [...validRoleIds, ...tg.roleIds];
  });

  const invalidSpaceRoleToRoleIds: string[] = [];
  const invalidRoleIds: string[] = [];

  invalidTokenGates.forEach((tg) => {
    tg.roleIds.forEach((roleId) => {
      // Remove invalid role if it is not granted by other token gate
      if (!validRoleIds.includes(roleId) && !invalidSpaceRoleToRoleIds.includes(roleId)) {
        const spaceRoleToRoleId = userSpaceRoles?.find((sr) => sr.roleId === roleId)?.id;
        if (spaceRoleToRoleId) {
          invalidSpaceRoleToRoleIds.push(spaceRoleToRoleId);
          invalidRoleIds.push(roleId);
        }
      }
    });
  });

  if (invalidSpaceRoleToRoleIds.length) {
    await removeUserRoles(invalidSpaceRoleToRoleIds);
  }

  // All token gates are invalid and user did not join via invite link soo he should be removed from space
  if (invalidTokenGates.length === userTokenGates.length && canBeRemovedFromSpace) {
    await prisma.spaceRole.delete({
      where: {
        spaceUser: {
          userId,
          spaceId
        }
      }
    });

    log.info(
      `User ${userId} was removed from space ${spaceId} because all ${userTokenGates.length} token gates are invalid`,
      { userId, spaceId }
    );

    return { verified: false, removedRoles: 0 };
  }

  if (invalidTokenGates.length) {
    log.info(
      `User ${userId} was not removed from space, has ${invalidTokenGates.length} invalid token gates and ${invalidRoleIds.length} roles removed`,
      { userId, spaceId, invalidRoleIds }
    );
  }

  return { verified: true, removedRoles: invalidSpaceRoleToRoleIds.length || 0 };
}

async function removeUserRoles(spaceRoleToRoleIds: string[]) {
  return prisma.spaceRoleToRole.deleteMany({
    where: {
      id: {
        in: spaceRoleToRoleIds
      }
    }
  });
}
