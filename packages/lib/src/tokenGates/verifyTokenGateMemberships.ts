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
import { verifyTokenGateMembership } from '@packages/lib/tokenGates/verifyTokenGateMembership';

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
        where: {
          archived: false
        },
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

  const spaceRoleQuery = userTokenGates.map((userTokenGate) => ({
    userId: userTokenGate.userId,
    spaceId: userTokenGate.spaceId
  }));

  const spaceRolesWithGates = await prisma.spaceRole.findMany({
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
                where: {
                  archived: false
                },
                include: {
                  tokenGateToRoles: true
                }
              }
            }
          }
        }
      },
      spaceRoleToRole: true
    }
  });

  let removedMembers = 0;
  let removedRoles = 0;

  for (const spaceRole of spaceRolesWithGates) {
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
