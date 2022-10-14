import { prisma } from 'db';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { updateMemberPropertyValue } from 'lib/members/updateMemberPropertyValue';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload[];
  spaceId: string;
  userId: string;
  updatedBy: string;
}

export function updateMemberPropertyValues ({ data, userId, spaceId, updatedBy }: UpdatePropertyInput) {
  const queries = data.map(propertyValue => updateMemberPropertyValue({ data: propertyValue, userId, spaceId, updatedBy }));

  return prisma.$transaction(queries);
}
