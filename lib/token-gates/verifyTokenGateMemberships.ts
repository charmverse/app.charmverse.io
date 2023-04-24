import type { Role, SpaceRole, SpaceRoleToRole, TokenGate, TokenGateToRole, User, UserTokenGate } from '@prisma/client';

import { prisma } from 'db';
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

export async function verifyTokenGateMemberships() {
  const userTokenGates = await prisma.userTokenGate.findMany({
    include: {
      tokenGate: {
        include: {
          tokenGateToRoles: {
            include: {
              role: true
            }
          }
        }
      },
      space: true,
      user: true
    }
  });

  const spaceRoleQuery = userTokenGates.map((userTokenGate) => ({
    userId: userTokenGate.userId,
    spaceId: userTokenGate.spaceId
  }));

  const usersWithTokenGates = await prisma.spaceRole.findMany({
    where: {
      // We do not want to delete admins
      isAdmin: false,
      // match userId / spaceId pairs
      OR: spaceRoleQuery
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
      },
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  let removedMembers = 0;
  let removedRoles = 0;

  for (const spaceRole of usersWithTokenGates) {
    // filter token gates related to the space
    const spaceUserTokenGates = spaceRole.user.userTokenGates.filter((utg) => utg.spaceId === spaceRole.spaceId);

    const res = await verifyTokenGateMembership({
      userTokenGates: spaceUserTokenGates,
      userId: spaceRole.user.id,
      spaceId: spaceRole.spaceId,
      userSpaceRoles: spaceRole.spaceRoleToRole,
      canBeRemovedFromSpace: !spaceRole.joinedViaLink
    });

    removedRoles += res.removedRoles;
    if (!res.verified) {
      removedMembers += 1;
    }
  }

  return {
    removedRoles,
    removedMembers
  };
}
