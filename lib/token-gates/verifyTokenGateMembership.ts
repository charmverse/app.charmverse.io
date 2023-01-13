import type { Role, SpaceRoleToRole, TokenGate, TokenGateToRole, UserTokenGate } from '@prisma/client';
import { verifyJwt } from 'lit-js-sdk';

import { prisma } from 'db';
import { assignRolesToSpaceRole } from 'lib/roles/assignRolesToSpaceRole';
import type { LitJwtPayload } from 'lib/token-gates/interfaces';

type TokenGateWithRoles = {
  tokenGate:
    | (TokenGate & {
        tokenGateToRoles: (TokenGateToRole & {
          role: Role;
        })[];
      })
    | null;
};

type UserTokenGateProp = Pick<UserTokenGate, 'id' | 'jwt' | 'grantedRoles' | 'tokenGateId'> & TokenGateWithRoles;

type VerifyTokenGateMembershipProps = {
  userTokenGates: UserTokenGateProp[];
  userId: string;
  spaceId: string;
  spaceRoleId: string;
  canBeRemovedFromSpace: boolean;
  userSpaceRoles?: (SpaceRoleToRole & { role: Role })[];
};

export async function verifyTokenGateMembership({
  userTokenGates,
  userSpaceRoles,
  userId,
  spaceId,
  spaceRoleId,
  canBeRemovedFromSpace
}: VerifyTokenGateMembershipProps): Promise<{ verified: boolean; removedRoles: number; addedRoles: number }> {
  if (!userTokenGates.length) {
    return { verified: true, removedRoles: 0, addedRoles: 0 };
  }

  const tokenGateVerificationPromises = userTokenGates.map(async (userTokenGate) => {
    if (!userTokenGate.jwt || !userTokenGate.tokenGate) {
      return { id: userTokenGate.id, isVerified: false, roleIds: userTokenGate.grantedRoles };
    }

    const result = (await verifyJwt({ jwt: userTokenGate.jwt })) as { payload: LitJwtPayload; verified: boolean };
    const isVerified = result.verified && result.payload?.orgId === spaceId;

    return {
      id: userTokenGate.tokenGateId,
      isVerified,
      roleIds: userTokenGate.tokenGate.tokenGateToRoles.map((r) => r.roleId)
    };
  });

  const tokenGateVerificationResults = await Promise.all(tokenGateVerificationPromises);
  const validTokenGates = tokenGateVerificationResults.filter((r) => r.isVerified);
  const invalidTokenGates = tokenGateVerificationResults.filter((r) => !r.isVerified);
  const assignedUserRoleIds = userSpaceRoles?.map((sr) => sr.roleId) || [];

  let validRoleIds: string[] = [];
  validTokenGates.forEach((tg) => {
    validRoleIds = [...validRoleIds, ...tg.roleIds];
  });

  const roleIdsToAssign = validRoleIds.filter((roleId) => !assignedUserRoleIds.includes(roleId));

  const invalidSpaceRoleToRoleIds: string[] = [];
  invalidTokenGates.forEach((tg) => {
    tg.roleIds.forEach((roleId) => {
      // Remove invalid role if it is not granted by other token gate
      if (!validRoleIds.includes(roleId) && !invalidSpaceRoleToRoleIds.includes(roleId)) {
        const spaceRoleToRoleId = userSpaceRoles?.find((sr) => sr.roleId === roleId)?.id;
        if (spaceRoleToRoleId) {
          invalidSpaceRoleToRoleIds.push(spaceRoleToRoleId);
        }
      }
    });
  });

  if (invalidSpaceRoleToRoleIds.length) {
    await removeUserRoles(invalidSpaceRoleToRoleIds);
  }

  if (roleIdsToAssign) {
    await assignRolesToSpaceRole({ roleIds: roleIdsToAssign, spaceRoleId });
  }

  // All token gates are invalid and user did not join via invite link - should be removed from space
  if (invalidTokenGates.length === userTokenGates.length && canBeRemovedFromSpace) {
    await prisma.spaceRole.delete({
      where: {
        spaceUser: {
          userId,
          spaceId
        }
      }
    });

    return { verified: false, removedRoles: 0, addedRoles: 0 };
  }

  return {
    verified: true,
    removedRoles: invalidSpaceRoleToRoleIds.length || 0,
    addedRoles: roleIdsToAssign.length || 0
  };
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
