import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

type CreatePropertyInput = {
  data: Prisma.MemberPropertyCreateInput;
  userId: string;
}

export function createMemberProperty ({ data, userId }: CreatePropertyInput) {
  return prisma.memberProperty.create({
    data: {
      ...data,
      updatedBy: userId,
      createdBy: userId
    }
  });
}
