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
  const usersWithTokenGates = await prisma.spaceRole.findMany({
    where: {
      // We do not want to delete admins
      isAdmin: false,
      user: {
        userTokenGates: {
          some: {}
        }
      }
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
    const res = await verifyTokenGateMembership({
      userTokenGates: spaceRole.user.userTokenGates,
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
