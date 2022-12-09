import { DEFAULT_MEMBER_PROPERTIES, HIDDEN_MEMBER_PROPERTIES, MEMBER_PROPERTY_CONFIG } from 'lib/members/constants';

export function generateDefaultPropertiesInput({ userId, spaceId }: { userId: string; spaceId: string }) {
  const defaultPropertiesInput = DEFAULT_MEMBER_PROPERTIES.map((memberProperty, memberPropertyIndex) => ({
    createdBy: userId,
    name: MEMBER_PROPERTY_CONFIG[memberProperty].label,
    index: memberPropertyIndex,
    type: memberProperty,
    updatedBy: userId,
    spaceId,
    enabledViews: HIDDEN_MEMBER_PROPERTIES.includes(memberProperty) ? [] : undefined
  }));

  return defaultPropertiesInput;
}
