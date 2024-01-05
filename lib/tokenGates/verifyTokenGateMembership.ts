import { getLogger } from '@charmverse/core/log';
import type {
  SpaceRoleToRole,
  TokenGate as PrismaTokenGate,
  TokenGateToRole,
  UserTokenGate
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

import { getHypersubValidTokenGate, getUnlockProtocolValidTokenGate } from './evaluateEligibility';
import type { TokenGate } from './interfaces';

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

  // We want to update only invalid token gates
  const tokenGateVerificationPromises = userTokenGates.map(async (userTokenGate) => {
    const { jwt, tokenGate: tokenGateWithRoles, id, grantedRoles } = userTokenGate;

    if (!tokenGateWithRoles) {
      return { id, isVerified: false, roleIds: grantedRoles };
    }

    const tokenGate = tokenGateWithRoles as TokenGate & { tokenGateToRoles: TokenGateToRole[] };

    if (tokenGate.type === 'unlock') {
      const wallets = await prisma.userWallet.findMany({
        where: {
          userId
        }
      });
      const values = await Promise.all(
        wallets.map(async (w) => {
          const valid = await getUnlockProtocolValidTokenGate(tokenGate, w.address);
          return valid;
        })
      );

      return {
        id: tokenGate.id,
        isVerified: values.some((v) => !!v?.tokenGateId),
        roleIds: tokenGate.tokenGateToRoles.map((r) => r.roleId)
      };
    } else if (tokenGate.type === 'hypersub') {
      const wallets = await prisma.userWallet.findMany({
        where: {
          userId
        }
      });
      const values = await Promise.all(
        wallets.map(async (w) => {
          const valid = await getHypersubValidTokenGate(tokenGate, w.address);
          return valid;
        })
      );

      return {
        id: tokenGate.id,
        isVerified: values.some((v) => !!v?.tokenGateId),
        roleIds: tokenGate.tokenGateToRoles.map((r) => r.roleId)
      };
    } else if (tokenGate.type === 'lit') {
      if (!jwt) {
        return { id, isVerified: false, roleIds: grantedRoles };
      }

      const lit = await import('@lit-protocol/lit-node-client');
      const result = lit.verifyJwt({ jwt });
      const isVerified = result.verified && (result.payload as any)?.orgId === spaceId;

      return {
        id: tokenGate.id,
        isVerified,
        roleIds: tokenGate.tokenGateToRoles.map((r) => r.roleId)
      };
    }

    return { id, isVerified: false, roleIds: tokenGateWithRoles?.tokenGateToRoles?.map((r) => r.roleId) || [] };
  });

  const tokenGateVerificationResults = await Promise.allSettled(tokenGateVerificationPromises).then((_r) =>
    _r
      .map((r) => {
        if (r.status === 'fulfilled') {
          return r.value;
        }
        if (r.status === 'rejected') {
          log.error('Error verifying token gate', { error: r.reason });
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
