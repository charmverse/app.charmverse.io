import type { Prisma } from '@prisma/client';

import { prisma } from 'db';

type UpdatePropertyInput = {
  data: Prisma.MemberPropertyUpdateInput;
  id: string;
  userId: string;
}

export function updateMemberProperty ({ data, userId, id }: UpdatePropertyInput) {
  return prisma.memberProperty.update({
    where: {
      id
    },
    data: { ...data, updatedBy: userId, id }
  });
}
