import { getLogger } from '@charmverse/core/log';
import type { Role, SpaceRoleToRole, TokenGate, TokenGateToRole, UserTokenGate } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import * as lit from '@lit-protocol/lit-node-client';

const log = getLogger('tg-verification');

type TokenGateWithRoles = {
  tokenGate:
    | (TokenGate & {
        tokenGateToRoles: TokenGateToRole[];
      })
    | null;
};

type UserTokenGateProp = Pick<UserTokenGate, 'id' | 'jwt' | 'grantedRoles' | 'tokenGateId'> & TokenGateWithRoles;

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
    if (!userTokenGate.jwt || !userTokenGate.tokenGate) {
      return { id: userTokenGate.id, isVerified: false, roleIds: userTokenGate.grantedRoles };
    }

    const result = lit.verifyJwt({ jwt: userTokenGate.jwt });
    const isVerified = result.verified && (result.payload as any)?.orgId === spaceId;

    return {
      id: userTokenGate.tokenGateId,
      isVerified,
      roleIds: userTokenGate.tokenGate.tokenGateToRoles.map((r) => r.roleId)
    };
  });

  const tokenGateVerificationResults = await Promise.all(tokenGateVerificationPromises);
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
