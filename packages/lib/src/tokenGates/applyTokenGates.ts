import type { Role, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from '@packages/metrics/mixpanel/updateTrackUserProfileById';
import {
  DataNotFoundError,
  InsecureOperationError,
  InvalidInputError,
  UnauthorisedActionError
} from '@packages/utils/errors';
import { isTruthy } from '@packages/utils/types';
import { applyDiscordGate } from '@packages/lib/discord/collabland/applyDiscordGate';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { updateUserTokenGates } from '@packages/lib/tokenGates/updateUserTokenGates';
import { v4 } from 'uuid';

import type { TokenGateJoinType } from './interfaces';
import { verifyTokenGates } from './verifyTokenGates';

export type TokenGateVerificationRequest = {
  spaceId: string;
  tokenGateIds: string[];
  commit: boolean;
  joinType?: TokenGateJoinType;
  reevaluate?: boolean;
};

type TokenGateVerificationResult = {
  space: Space;
  roles: Role[];
};

export async function applyTokenGates({
  spaceId,
  userId,
  tokenGateIds,
  commit,
  reevaluate = false
}: TokenGateVerificationRequest & { userId: string }): Promise<TokenGateVerificationResult> {
  if (!spaceId || !userId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [spaceId],
    userId
  });

  if (isUserBannedFromSpace) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new UnauthorisedActionError(`You have been banned from this space.`);
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

  const verifiedTokenGates = await verifyTokenGates({ spaceId, userId, tokenGateIds });

  if (verifiedTokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new InsecureOperationError('At least one token gate verification must succeed to grant a space membership.');
  }

  const roleIdsToAssign: string[] = verifiedTokenGates.reduce<string[]>((roleList, tokenGate) => {
    tokenGate.tokenGateToRoles.forEach(({ role }) => {
      if (!roleList.includes(role.id) && space.roles.some((_role) => _role.id === role.id)) {
        roleList.push(role.id);
      }
    });

    return roleList;
  }, []);

  const assignedRoles: Role[] = roleIdsToAssign
    .map((roleId) => space.roles.find((role) => role.id === roleId))
    .filter(isTruthy);

  const returnValue: TokenGateVerificationResult = {
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
