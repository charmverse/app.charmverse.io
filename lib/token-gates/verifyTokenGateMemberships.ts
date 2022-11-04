
import { prisma } from 'db';
import { verifyTokenGateMembership } from 'lib/token-gates/verifyTokenGateMembership';

export async function verifyTokenGateMemberships () {
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
          userTokenGates: true
        }
      }
    }
  });

  const promises = usersWithTokenGates.map(async spaceRole => verifyTokenGateMembership({
    userTokenGates: spaceRole.user.userTokenGates,
    userId: spaceRole.user.id,
    spaceId: spaceRole.spaceId
  }));

  const res = await Promise.all(promises);
  const verifiedUsers = res.filter(Boolean).length;
  const deletedUsers = usersWithTokenGates.length - verifiedUsers;

  return {
    verifiedUsers,
    deletedUsers
  };
}
