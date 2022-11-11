import { DEFAULT_MEMBER_PROPERTIES_ORDER, MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';

export function generateDefaultPropertiesInput ({ userId, spaceId }: { userId: string, spaceId: string }) {
  const defaultPropertiesInput = DEFAULT_MEMBER_PROPERTIES_ORDER.map((memberProperty, memberPropertyIndex) => ({
    createdBy: userId,
    name: MEMBER_PROPERTY_CONFIG[memberProperty].label,
    index: memberPropertyIndex,
    type: memberProperty,
    updatedBy: userId,
    spaceId
  }));

  return defaultPropertiesInput;
}
