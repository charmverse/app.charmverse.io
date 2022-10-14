import { prisma } from 'db';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload[];
  spaceId: string;
  userId: string;
}

export function updateMemberPropertyValues ({ data, userId, spaceId }: UpdatePropertyInput) {
  const txs = data.map(propertyValue => prisma.memberPropertyValue.upsert({
    where: {
      memberPropertyId_spaceId_userId: {
        memberPropertyId: propertyValue.memberPropertyId,
        userId,
        spaceId
      }
    },
    update: { value: propertyValue.value || undefined, updatedBy: userId },
    create: {
      value: propertyValue.value || undefined,
      updatedBy: userId,
      memberPropertyId: propertyValue.memberPropertyId,
      userId,
      spaceId
    }

  }));

  return prisma.$transaction(txs);
}
