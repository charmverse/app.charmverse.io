import { prisma } from '@charmverse/core/prisma-client';

export async function generateTokenGate({ userId, spaceId }: { spaceId: string; userId: string }) {
  return prisma.tokenGate.create({
    data: {
      conditions: {
        unifiedAccessControlConditions: [
          {
            conditionType: 'evmBasic',
            contractAddress: '',
            standardContractType: '',
            chain: 'ethereum',
            method: '',
            parameters: [':userAddress'],
            returnValueTest: {
              comparator: '=',
              value: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'
            }
          }
        ]
      },
      createdBy: userId,
      resourceId: {},
      type: 'lit',
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });
}

export async function generateUnlockTokenGate({ userId, spaceId }: { spaceId: string; userId: string }) {
  return prisma.tokenGate.create({
    data: {
      conditions: {
        contract: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
        chainId: 1
      },
      createdBy: userId,
      resourceId: {},
      type: 'unlock',
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });
}

export async function generateHypersubTokenGate({ userId, spaceId }: { spaceId: string; userId: string }) {
  return prisma.tokenGate.create({
    data: {
      conditions: {
        contract: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2',
        chainId: 1
      },
      createdBy: userId,
      resourceId: {},
      type: 'hypersub',
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

export async function clearTokenGateData() {
  if (process.env.NODE_ENV !== 'production') {
    await prisma.tokenGate.deleteMany({});
    await prisma.userTokenGate.deleteMany({});
  }
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
  grantedRoles: string[];
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
