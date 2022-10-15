import { prisma } from 'db';
import { getVisibleMemberPropertiesBySpace } from 'lib/members/getVisibleMemberPropertiesBySpace';
import type { MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from 'lib/members/utils';

type UpdatePropertyInput = {
  memberId: string;
  requestingUserId: string;
  spaceId?: string | undefined;
}

export async function getSpacesPropertyValues ({ memberId, requestingUserId, spaceId }: UpdatePropertyInput): Promise<MemberPropertyValuesBySpace[]> {
  const commonSpaces = await prisma.space.findMany({
    where: {
      id: spaceId || undefined,
      AND: [
        {
          spaceRoles: {
            some: {
              userId: memberId
            }
          }
        },
        {
          spaceRoles: {
            some: {
              userId: requestingUserId
            }
          }
        }
      ]
    },
    select: { id: true }
  });

  const spaceIds = commonSpaces.map(s => s.id);
  const visibleMemberProperties = await getVisibleMemberPropertiesBySpace({ userId: requestingUserId, spaceId: spaceIds });
  const memberPropertyIds = visibleMemberProperties.map(mp => mp.id);

  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      userId: memberId,
      memberPropertyId: {
        in: memberPropertyIds
      }
    }
  });

  const propertyValues = getPropertiesWithValues(visibleMemberProperties, memberPropertyValues);

  return groupPropertyValuesBySpace(propertyValues);
}
