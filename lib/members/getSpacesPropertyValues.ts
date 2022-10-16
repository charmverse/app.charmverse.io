import { prisma } from 'db';
import { getCommonSpaceIds } from 'lib/members/getCommonSpaceIds';
import { getVisibleMemberPropertiesBySpace } from 'lib/members/getVisibleMemberPropertiesBySpace';
import type { CommonSpacesInput, MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from 'lib/members/utils';

export async function getSpacesPropertyValues ({ memberId, requestingUserId, spaceId }: CommonSpacesInput): Promise<MemberPropertyValuesBySpace[]> {
  const spaceIds = await getCommonSpaceIds({ spaceId, memberId, requestingUserId });
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
