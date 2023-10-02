import type {
  Role,
  SpaceRole,
  SpaceRoleToRole,
  TokenGate,
  TokenGateToRole,
  User,
  UserTokenGate
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { verifyTokenGateMembership } from 'lib/token-gates/verifyTokenGateMembership';

export type UserToVerifyMembership = SpaceRole & {
  user: User & {
    userTokenGates: (UserTokenGate & {
      tokenGate:
        | (TokenGate & {
            tokenGateToRoles: (TokenGateToRole & {
              role: Role;
            })[];
          })
        | null;
    })[];
  };
  spaceRoleToRole: (SpaceRoleToRole & {
    role: Role;
  })[];
};

const maxBatchSize = 500;

export async function verifyTokenGateMemberships() {
  let removedMembers = 0;
  let removedRoles = 0;

  const totalUserTokenGates = await prisma.userTokenGate.count();

  let lastId: string | undefined;

  for (let i = 0; i < totalUserTokenGates; i += maxBatchSize) {
    if (totalUserTokenGates === 0) {
      break;
    }

    const usersWithTokenGates = await prisma.user.findMany({
      skip: 1,
      cursor: {
        id: lastId
      },
      where: {
        // We do not want to delete admins
        // match userId / spaceId pairs
        userTokenGates: {
          some: {}
        }
      },
      select: {
        id: true,
        spaceRoles: {
          where: {
            isAdmin: false
          },
          select: {
            id: true,
            spaceId: true,
            isAdmin: true,
            joinedViaLink: true,
            spaceRoleToRole: {
              include: {
                role: true
              }
            }
          }
        },
        userTokenGates: {
          include: {
            tokenGate: {
              include: {
                tokenGateToRoles: {
                  select: {
                    roleId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    for (const user of usersWithTokenGates) {
      for (const spaceRole of user.spaceRoles) {
        const userTokenGatesBySpace = user.userTokenGates.filter((tg) => tg.spaceId === spaceRole.spaceId);
        const res = await verifyTokenGateMembership({
          userTokenGates: userTokenGatesBySpace,
          userId: user.id,
          spaceId: spaceRole.spaceId,
          userSpaceRoles: spaceRole.spaceRoleToRole,
          canBeRemovedFromSpace: !spaceRole.joinedViaLink
        });

        removedRoles += res.removedRoles;
        if (!res.verified) {
          removedMembers += 1;
        }
      }
    }
  }

  return {
    removedRoles,
    removedMembers
  };
}
