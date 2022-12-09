import { prisma } from 'db';

export async function generateTokenGate({ userId, spaceId }: { spaceId: string; userId: string }) {
  return prisma.tokenGate.create({
    data: {
      conditions: {},
      createdBy: userId,
      resourceId: {},
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });
}

export async function deleteTokenGate(id: string) {
  return prisma.tokenGate.delete({
    where: {
      id
    }
  });
}

export async function addRoleToTokenGate({ tokenGateId, roleId }: { tokenGateId: string; roleId: string }) {
  return prisma.tokenGateToRole.create({
    data: {
      tokenGate: {
        connect: {
          id: tokenGateId
        }
      },
      role: {
        connect: {
          id: roleId
        }
      }
    }
  });
}

export function addUserTokenGate({
  tokenGateId,
  grantedRoles,
  spaceId,
  userId,
  jwt
}: {
  tokenGateId: string;
  spaceId: string;
  userId: string;
  grantedRoles: string;
  jwt: string;
}) {
  return prisma.userTokenGate.create({
    data: {
      jwt,
      tokenGateConnectedDate: new Date(),
      space: {
        connect: { id: spaceId }
      },
      user: {
        connect: { id: userId }
      },
      tokenGate: {
        connect: { id: tokenGateId }
      },
      grantedRoles
    }
  });
}
