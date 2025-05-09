import { prisma } from '@charmverse/core/prisma-client';
import type { UpdateMemberPropertyValuePayload } from '@packages/lib/members/interfaces';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload;
  spaceId: string;
  userId: string;
  updatedBy: string;
};

export function updateMemberPropertyValue({ data, userId, spaceId, updatedBy }: UpdatePropertyInput) {
  return prisma.memberPropertyValue.upsert({
    where: {
      memberPropertyId_spaceId_userId: {
        memberPropertyId: data.memberPropertyId,
        userId,
        spaceId
      }
    },
    update: {
      value: data.value || '',
      updatedBy
    },
    create: {
      value: data.value || '',
      updatedBy,
      memberPropertyId: data.memberPropertyId,
      userId,
      spaceId
    },
    include: {
      memberProperty: true,
      space: true
    }
  });
}
