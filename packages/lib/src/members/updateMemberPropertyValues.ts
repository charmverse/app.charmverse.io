import { prisma } from '@charmverse/core/prisma-client';
import { READONLY_MEMBER_PROPERTIES } from '@packages/lib/members/constants';
import type { PropertyValueWithDetails, UpdateMemberPropertyValuePayload } from '@packages/lib/members/interfaces';
import { updateMemberPropertyValue } from '@packages/lib/members/updateMemberPropertyValue';
import { mapPropertyValueWithDetails } from '@packages/lib/members/utils';

type UpdatePropertyInput = {
  data: UpdateMemberPropertyValuePayload[];
  spaceId: string;
  userId: string;
  updatedBy: string;
};

export async function updateMemberPropertyValues({
  data,
  userId,
  spaceId,
  updatedBy
}: UpdatePropertyInput): Promise<PropertyValueWithDetails[]> {
  const writableProperties = await prisma.memberProperty.findMany({
    where: {
      id: { in: data.map((d) => d.memberPropertyId) },
      type: { notIn: READONLY_MEMBER_PROPERTIES }
    }
  });

  const writableIds = writableProperties.map((p) => p.id);
  const queries = data
    .filter((pv) => writableIds.includes(pv.memberPropertyId))
    .map((pv) => updateMemberPropertyValue({ data: pv, userId, spaceId, updatedBy }));

  const updated = await prisma.$transaction(queries);
  return updated.map(mapPropertyValueWithDetails);
}
