import { prisma } from '@charmverse/core/prisma-client';
import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';

export async function generateTokenGate({
  userId,
  spaceId,
  extraDetails
}: {
  spaceId: string;
  userId: string;
  extraDetails?: Partial<AccessControlCondition>;
}) {
  return prisma.tokenGate.create({
    data: {
      conditions: {
        accessControlConditions: [
          {
            ...extraDetails,
            chain: 1,
            method: 'balanceOf',
            tokenIds: ['0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2'],
            type: 'Wallet',
            contractAddress: '',
            quantity: '1',
            condition: 'evm',
            image: '/images/cryptoLogos/ethereum-icon-purple.svg'
          }
        ],
        operator: 'OR'
      },
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

export async function clearTokenGateData() {
  if (process.env.NODE_ENV !== 'production') {
    await prisma.tokenGate.deleteMany({});
    await prisma.userTokenGate.deleteMany({});
  }
}

export function addUserTokenGate({
  tokenGateId,
  grantedRoles,
  spaceId,
  userId
}: {
  tokenGateId: string;
  spaceId: string;
  userId: string;
  grantedRoles: string[];
}) {
  return prisma.userTokenGate.create({
    data: {
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
