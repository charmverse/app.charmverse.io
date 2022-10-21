import { getCommonSpaceIds } from 'lib/members/getCommonSpaceIds';
import { getSpacesPropertyValues } from 'lib/members/getSpacesPropertyValues';
import type { CommonSpacesInput, PropertyValue } from 'lib/members/interfaces';

type CommonSpaceProps = CommonSpacesInput & {
  spaceId: string;
}

export async function getSpacePropertyValues ({ memberId, requestingUserId, spaceId }: CommonSpaceProps): Promise<PropertyValue[]> {
  const spaceIds = await getCommonSpaceIds({ spaceId, memberId, requestingUserId });
  // We want to retirn results for single specific space
  if (spaceIds.length !== 1) {
    return [];
  }

  const groupedResults = await getSpacesPropertyValues({ memberId, requestingUserId, spaceId });

  return groupedResults[0].properties || [];
}
