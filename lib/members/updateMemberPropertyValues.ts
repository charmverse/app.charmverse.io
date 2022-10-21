import { prisma } from 'db';
import type { PropertyValueWithDetails, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import { updateMemberPropertyValue } from 'lib/members/updateMemberPropertyValue';
import { mapPropertyValueWithDetails } from 'lib/members/utils';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload[];
  spaceId: string;
  userId: string;
  updatedBy: string;
}

export async function updateMemberPropertyValues ({ data, userId, spaceId, updatedBy }: UpdatePropertyInput): Promise<PropertyValueWithDetails[]> {
  const queries = data.map(propertyValue => updateMemberPropertyValue({ data: propertyValue, userId, spaceId, updatedBy }));

  const updated = await prisma.$transaction(queries);
  return updated.map(mapPropertyValueWithDetails);
}
