import { prisma } from '@charmverse/core/prisma-client';
import type { TokenGateResult } from '@packages/lib/tokenGates/verifyTokenGates';

type UpdateUserTokenGatesProps = { tokenGates: TokenGateResult[]; spaceId: string; userId: string };

type UpsertTokenGateProps = {
  tokenGateId: string;
  spaceId: string;
  userId: string;
  grantedRoles: string[];
};
type DeleteTokenGateProps = { tokenGateId: string; spaceId: string; userId: string } | { id: string };

export async function updateUserTokenGates({ tokenGates, spaceId, userId }: UpdateUserTokenGatesProps) {
  const verified = tokenGates.filter((tg) => tg.verified);
  const nonVerified = tokenGates.filter((tg) => !tg.verified);

  return prisma.$transaction([
    ...verified.map((tg) =>
      upsertUserTokenGate({ spaceId, tokenGateId: tg.id, userId, grantedRoles: tg.grantedRoles })
    ),
    ...nonVerified.map((tg) => deleteUserTokenGate({ spaceId, tokenGateId: tg.id, userId }))
  ]);
}

function upsertUserTokenGate({ spaceId, tokenGateId, userId, grantedRoles }: UpsertTokenGateProps) {
  return prisma.userTokenGate.upsert({
    where: {
      tokenGateUserSpace: {
        tokenGateId,
        userId,
        spaceId
      }
    },
    create: {
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
    },
    update: {
      tokenGateConnectedDate: new Date()
    }
  });
}

export function deleteUserTokenGates(userTokenGates: { id: string }[]) {
  const ids = userTokenGates.map((tg) => tg.id);
  return prisma.userTokenGate.deleteMany({
    where: {
      id: { in: ids }
    }
  });
}

export function deleteUserTokenGate(props: DeleteTokenGateProps) {
  if ('id' in props) {
    return prisma.userTokenGate.delete({
      where: {
        id: props.id
      }
    });
  }

  const { spaceId, tokenGateId, userId } = props;

  return prisma.userTokenGate.delete({
    where: {
      tokenGateUserSpace: {
        tokenGateId,
        userId,
        spaceId
      }
    }
  });
}
