import { prisma } from 'db';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload;
  spaceId: string;
  userId: string;
  updatedBy: string;
}

export function updateMemberPropertyValue ({ data, userId, spaceId, updatedBy }: UpdatePropertyInput) {
  return prisma.memberPropertyValue.upsert({
    where: {
      memberPropertyId_spaceId_userId: {
        memberPropertyId: data.memberPropertyId,
        userId,
        spaceId
      }
    },
    update: { value: data.value || undefined, updatedBy },
    create: {
      value: data.value || undefined,
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
