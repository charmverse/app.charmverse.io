import { prisma } from 'db';
import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import { getCommonSpaceIds } from 'lib/members/getCommonSpaceIds';
import { getSpaceMemberRoles } from 'lib/members/getSpaceMemberRoles';
import type { CommonSpacesInput, MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from 'lib/members/utils';

import { getSpaceMemberJoinDates } from './getSpaceMemberJoinDates';

export async function getSpacesPropertyValues ({ memberId, requestingUserId, spaceId }: CommonSpacesInput): Promise<MemberPropertyValuesBySpace[]> {
  const spaceIds = requestingUserId ? await getCommonSpaceIds({ spaceId, memberId, requestingUserId }) : [];
  const visibleMemberProperties = await getAccessibleMemberPropertiesBySpace({ spaceId: spaceIds, userId: requestingUserId });
  const memberPropertyIds = visibleMemberProperties.map(mp => mp.id);

  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      userId: memberId,
      memberPropertyId: {
        in: memberPropertyIds
      }
    }
  });

  let propertyValues = getPropertiesWithValues(visibleMemberProperties, memberPropertyValues, { withSpaceDetails: true });

  if (visibleMemberProperties.find(mp => mp.type === 'role')) {
    const spaceRolesMap = await getSpaceMemberRoles({ spaceIds, memberId });
    propertyValues = propertyValues.map(pv => pv.type === 'role' ? { ...pv, value: spaceRolesMap[pv.spaceId]?.map(r => r.name) || [] } : pv);
  }
  if (visibleMemberProperties.find(mp => mp.type === 'join_date')) {
    const joinDatesMap = await getSpaceMemberJoinDates({ spaceIds, memberId });
    propertyValues = propertyValues.map(pv => pv.type === 'join_date' ? { ...pv, value: joinDatesMap[pv.spaceId] } : pv);
  }

  return groupPropertyValuesBySpace(propertyValues);
}
