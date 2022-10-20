import type { Role } from '@prisma/client';
import { verifyJwt } from 'lit-js-sdk';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';

import type { LitJwtPayload, TokenGateVerification, TokenGateVerificationResult, TokenGateWithRoles } from './interfaces';

export async function applyTokenGates ({
  spaceId, userId, tokens, commit, joinType = 'token_gate'
}: TokenGateVerification): Promise<TokenGateVerificationResult> {

  if (!spaceId || !userId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    include: {
      roles: true,
      TokenGate: {
        include: {
          tokenGateToRoles: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (!space) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError(`Could not find space with id ${spaceId}.`);
  }

  const { TokenGate: tokenGates } = space;

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError('No token gates were found for this space.');
  }

  const verifiedTokenGates: TokenGateWithRoles[] = (await Promise.all(tokens.map(async tk => {
    const result = await verifyJwt({ jwt: tk.signedToken }) as { payload: LitJwtPayload, verified: boolean };

    const matchingTokenGate = tokenGates.find(g => g.id === tk.tokenGateId);

    // Only check against existing token gates for this space
    if (matchingTokenGate
    // Perform additional checks here as per https://github.com/LIT-Protocol/lit-minimal-jwt-example/blob/main/server.js
    && result?.verified && result.payload?.orgId === space.id) {

      const embeddedTokenGateId = JSON.parse(result.payload.extraData).tokenGateId;

      if (embeddedTokenGateId === tk.tokenGateId) {
        return matchingTokenGate;
      }
    }

    return null;

  }))).filter(tk => tk !== null) as TokenGateWithRoles[];

  if (verifiedTokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new InsecureOperationError('At least one token gate verification must succeed to grant a space membership.');
  }

  const roleIdsToAssign: string[] = verifiedTokenGates.reduce((roleList, tokenGate) => {

    tokenGate.tokenGateToRoles.forEach(roleMapping => {
      if (!roleList.includes(roleMapping.roleId) && space.roles.some(role => role.id === roleMapping.roleId)) {
        roleList.push(roleMapping.roleId);
      }
    });

    return roleList;
  }, [] as string[]);

  const assignedRoles = roleIdsToAssign.map(roleId => space.roles.find(role => role.id === roleId) as Role);

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  const returnValue: TokenGateVerificationResult = {
    userId,
    space,
    roles: assignedRoles
  };

  trackUserAction('token_gate_verification', { result: 'pass', spaceId, userId, roles: assignedRoles.map(r => r.name) });
  trackUserAction('join_a_workspace', { spaceId, userId, source: joinType });

  if (!commit) {
    return returnValue;
  }
  else if (spaceMembership && roleIdsToAssign.length === 0) {
    return returnValue;
  }
  else if (spaceMembership) {
    await prisma.$transaction(roleIdsToAssign.map(roleId => {
      return prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: spaceMembership.id,
            roleId
          }
        },
        create: {
          role: {
            connect: {
              id: roleId
            }
          },
          spaceRole: {
            connect: {
              id: spaceMembership.id
            }
          }
        },
        // Perform an empty update
        update: {}
      });
    }));

    updateTrackUserProfileById(userId);

    return returnValue;
  }
  else {
    const spaceRoleId = v4();
    await prisma.spaceRole.create({
      data: {
        id: spaceRoleId,
        spaceRoleToRole: {
          createMany: {
            data: roleIdsToAssign.map(roleId => {
              return {
                roleId
              };
            }) }
        },
        isAdmin: false,
        space: {
          connect: {
            id: spaceId
          }
        },
        user: {
          connect: {
            id: userId
          }
        }
      }
    });

    updateTrackUserProfileById(userId);

    return returnValue;
  }

}
