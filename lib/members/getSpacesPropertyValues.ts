import { prisma } from 'db';
import { getCommonSpaceIds } from 'lib/members/getCommonSpaceIds';
import { getSpaceMemberRoles } from 'lib/members/getSpaceMemberRoles';
import { getVisibleMemberPropertiesBySpace } from 'lib/members/getVisibleMemberPropertiesBySpace';
import type { CommonSpacesInput, MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from 'lib/members/utils';

export async function getSpacesPropertyValues ({ memberId, requestingUserId, spaceId }: CommonSpacesInput): Promise<MemberPropertyValuesBySpace[]> {
  const spaceIds = requestingUserId ? await getCommonSpaceIds({ spaceId, memberId, requestingUserId }) : [];
  const visibleMemberProperties = await getVisibleMemberPropertiesBySpace({ spaceId: spaceIds, userId: requestingUserId });
  const memberPropertyIds = visibleMemberProperties.map(mp => mp.id);

  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      userId: memberId,
      memberPropertyId: {
        in: memberPropertyIds
      }
    }
  });

  let propertyValues = getPropertiesWithValues(visibleMemberProperties, memberPropertyValues);

  if (visibleMemberProperties.find(mp => mp.type === 'role')) {
    const spaceRolesMap = await getSpaceMemberRoles(spaceIds);
    propertyValues = propertyValues.map(pv => pv.type === 'role' ? { ...pv, value: spaceRolesMap[pv.spaceId]?.map(r => r.name) || [] } : pv);
  }

  return groupPropertyValuesBySpace(propertyValues);
}
