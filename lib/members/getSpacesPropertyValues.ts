import { prisma } from 'db';
import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import { getCommonSpaceIds } from 'lib/members/getCommonSpaceIds';
import { getSpaceMemberMetadata } from 'lib/members/getSpaceMemberMetadata';
import type { CommonSpacesInput, MemberPropertyValuesBySpace } from 'lib/members/interfaces';
import { getPropertiesWithValues, groupPropertyValuesBySpace } from 'lib/members/utils';

export async function getSpacesPropertyValues({
  memberId,
  requestingUserId,
  spaceId
}: CommonSpacesInput): Promise<MemberPropertyValuesBySpace[]> {
  const spaceIds = requestingUserId ? await getCommonSpaceIds({ spaceId, memberId, requestingUserId }) : [];
  const visibleMemberProperties = await getAccessibleMemberPropertiesBySpace({
    requestedUserId: memberId,
    spaceId: spaceIds,
    requestingUserId
  });
  const memberPropertyIds = visibleMemberProperties.map((mp) => mp.id);

  const memberPropertyValues = await prisma.memberPropertyValue.findMany({
    where: {
      userId: memberId,
      memberPropertyId: {
        in: memberPropertyIds
      }
    }
  });

  let propertyValues = getPropertiesWithValues(visibleMemberProperties, memberPropertyValues, {
    withSpaceDetails: true
  });

  const isRolePropertyVisible = visibleMemberProperties.find((mp) => mp.type === 'role');
  const isJoinDatePropertyVisible = visibleMemberProperties.find((mp) => mp.type === 'join_date');

  if (isRolePropertyVisible || isJoinDatePropertyVisible) {
    const spaceMetadataMap = await getSpaceMemberMetadata({ spaceIds, memberId });
    propertyValues = propertyValues.map((pv) => {
      if (pv.type === 'role' && isRolePropertyVisible) {
        return { ...pv, value: spaceMetadataMap[pv.spaceId]?.roles.map((r) => r.name) || [] };
      } else if (pv.type === 'join_date' && isJoinDatePropertyVisible) {
        return { ...pv, value: spaceMetadataMap[pv.spaceId]?.joinDate };
      }

      return pv;
    });
  }
  return groupPropertyValuesBySpace(propertyValues);
}
