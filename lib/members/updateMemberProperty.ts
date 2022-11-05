import type { MemberProperty, Prisma, PrismaPromise } from '@prisma/client';

import { prisma } from 'db';

type UpdatePropertyInput = {
  data: Prisma.MemberPropertyUpdateInput;
  id: string;
  userId: string;
  spaceId: string;
}

export async function updateMemberProperty ({ data, userId, id, spaceId }: UpdatePropertyInput) {
  const transactions: PrismaPromise<any>[] = [];
  const newIndex = data.index;
  if (newIndex !== null && newIndex !== undefined) {
    const memberProperty = await prisma.memberProperty.findUnique({
      where: {
        id
      },
      select: {
        index: true
      }
    }) as MemberProperty;

    const currentIndex = memberProperty.index;

    transactions.push(prisma.memberProperty.updateMany({
      where: {
        spaceId,
        index: currentIndex < newIndex ? {
          gt: currentIndex,
          lte: newIndex as number
        } : {
          lt: currentIndex,
          gte: newIndex as number
        }
      },
      data: {
        index: currentIndex < newIndex ? {
          decrement: 1
        } : {
          increment: 1
        }
      }
    }));
  }

  transactions.push(prisma.memberProperty.update({
    where: {
      id
    },
    data: { ...data, updatedBy: userId, id }
  }));

  return prisma.$transaction(transactions);
}
