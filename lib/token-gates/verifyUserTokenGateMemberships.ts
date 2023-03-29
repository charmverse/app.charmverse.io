import { prisma } from 'db';
import { verifyTokenGateMembership } from 'lib/token-gates/verifyTokenGateMembership';

export async function verifyUserTokenGateMemberships(userId: string) {
  // user can have more than one space role to be verified
  const membershipWithTokenGates = await prisma.spaceRole.findMany({
    where: {
      // We do not want to delete admins
      isAdmin: false,
      user: {
        id: userId,
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

  let removedFromSpacesCount = 0;
  let removedRoles = 0;

  for (const spaceRole of membershipWithTokenGates) {
    const res = await verifyTokenGateMembership({
      userTokenGates: spaceRole.user.userTokenGates,
      userId: spaceRole.user.id,
      spaceId: spaceRole.spaceId,
      userSpaceRoles: spaceRole.spaceRoleToRole,
      canBeRemovedFromSpace: !spaceRole.joinedViaLink
    });

    removedRoles += res.removedRoles;
    if (!res.verified) {
      removedFromSpacesCount += 1;
    }
  }

  return {
    removedRoles,
    removedFromSpacesCount
  };
}
