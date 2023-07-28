import type { Role } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { verifyJwt } from '@lit-protocol/lit-node-client';
import { v4 } from 'uuid';

import { applyDiscordGate } from 'lib/discord/applyDiscordGate';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { updateUserTokenGates } from 'lib/token-gates/updateUserTokenGates';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';

import type {
  TokenGateJwtResult,
  TokenGateVerification,
  TokenGateVerificationResult,
  TokenGateWithRoles
} from './interfaces';

export async function applyTokenGates({
  spaceId,
  userId,
  tokens,
  commit,
  reevaluate = false
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
      tokenGates: {
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

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!spaceMembership && reevaluate) {
    throw new InvalidInputError('User is not a member of this space.');
  }

  const { tokenGates } = space;

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError('No token gates were found for this space.');
  }

  const verifiedTokenGates: (TokenGateWithRoles & TokenGateJwtResult)[] = (
    await Promise.all(
      tokens.map(async (tk) => {
        const result = verifyJwt({ jwt: tk.signedToken });
        const matchingTokenGate = tokenGates.find((g) => g.id === tk.tokenGateId);
        const payload = result?.payload as any;
        // Only check against existing token gates for this space
        if (
          matchingTokenGate &&
          // Perform additional checks here as per https://github.com/LIT-Protocol/lit-minimal-jwt-example/blob/main/server.js
          result?.verified &&
          payload?.orgId === space.id
        ) {
          const embeddedTokenGateId = JSON.parse(payload.extraData).tokenGateId;

          if (embeddedTokenGateId === tk.tokenGateId) {
            return {
              ...matchingTokenGate,
              jwt: tk.signedToken,
              verified: true,
              grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.roleId)
            };
          }
        }

        return null;
      })
    )
  ).filter((tk) => tk !== null) as (TokenGateWithRoles & TokenGateJwtResult)[];

  if (verifiedTokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new InsecureOperationError('At least one token gate verification must succeed to grant a space membership.');
  }

  const roleIdsToAssign: string[] = verifiedTokenGates.reduce((roleList, tokenGate) => {
    tokenGate.tokenGateToRoles.forEach((roleMapping) => {
      if (!roleList.includes(roleMapping.roleId) && space.roles.some((role) => role.id === roleMapping.roleId)) {
        roleList.push(roleMapping.roleId);
      }
    });

    return roleList;
  }, [] as string[]);

  const assignedRoles = roleIdsToAssign.map((roleId) => space.roles.find((role) => role.id === roleId) as Role);

  const returnValue: TokenGateVerificationResult = {
    userId,
    space,
    roles: assignedRoles
  };

  if (!reevaluate) {
    trackUserAction('token_gate_verification', {
      result: 'pass',
      spaceId,
      userId,
      roles: assignedRoles.map((r) => r.name)
    });
  }

  if (!commit) {
    return returnValue;
  }

  // Try to apply discord gate first
  await applyDiscordGate({ spaceId, userId });

  await updateUserTokenGates({ tokenGates: verifiedTokenGates, spaceId, userId });

  if (spaceMembership && roleIdsToAssign.length === 0) {
    return returnValue;
  } else if (spaceMembership) {
    await prisma.$transaction(
      roleIdsToAssign.map((roleId) => {
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
      })
    );

    updateTrackUserProfileById(userId);

    return returnValue;
  } else {
    const spaceRoleId = v4();
    await prisma.spaceRole.create({
      data: {
        id: spaceRoleId,
        spaceRoleToRole: {
          createMany: {
            data: roleIdsToAssign.map((roleId) => {
              return {
                roleId
              };
            })
          }
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

    return returnValue;
  }
}
