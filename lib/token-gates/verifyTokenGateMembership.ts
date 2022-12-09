import type { Role, SpaceRoleToRole, TokenGate, TokenGateToRole, UserTokenGate } from '@prisma/client';
import { verifyJwt } from 'lit-js-sdk';

import { prisma } from 'db';
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
  canBeRemovedFromSpace: boolean;
  userSpaceRoles?: (SpaceRoleToRole & { role: Role })[];
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

  let validRoleIds: string[] = [];
  validTokenGates.forEach((tg) => {
    validRoleIds = [...validRoleIds, ...tg.roleIds];
  });

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

  // All token gates are invalid and user did not join via invite link soo he should be removed from space
  if (invalidTokenGates.length === userTokenGates.length && canBeRemovedFromSpace) {
    // TEMP - run in test mode
    // await prisma.spaceRole.delete({
    //   where: {
    //     spaceUser: {
    //       userId,
    //       spaceId
    //     }
    //   }
    // });

    return { verified: false, removedRoles: 0 };
  }

  return { verified: true, removedRoles: invalidSpaceRoleToRoleIds.length || 0 };
}

async function removeUserRoles(spaceRoleToRoleIds: string[]) {
  // TEMP - run in test mode
  // return prisma.spaceRoleToRole.deleteMany({
  //   where: {
  //     id: {
  //       in: spaceRoleToRoleIds
  //     }
  //   }
  // });
}
