import type { MemberPropertyType } from '@prisma/client';

import { DEFAULT_MEMBER_PROPERTIES, MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';

export function generateDefaultPropertiesInput ({ userId, spaceId }: { userId: string, spaceId: string }) {
  const defaultPropertiesInput = DEFAULT_MEMBER_PROPERTIES.map((memberProperty, memberPropertyIndex) => ({
    createdBy: userId,
    name: MEMBER_PROPERTY_CONFIG[memberProperty].label,
    index: memberPropertyIndex,
    type: (memberProperty as MemberPropertyType),
    updatedBy: userId,
    spaceId
  }));

  return defaultPropertiesInput;
}
