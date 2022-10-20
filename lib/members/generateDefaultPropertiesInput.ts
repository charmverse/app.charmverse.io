import type { MemberPropertyType } from '@prisma/client';

import { DEFAULT_MEMBER_PROPERTIES, MEMBER_PROPERTY_LABELS } from 'lib/members/constants';

const DEFAULT_CUSTOM_PROPERTIES: { name: string, type: MemberPropertyType }[] = [
  { name: 'Bio', type: 'text_multiline' }
];

export function generateDefaultPropertiesInput ({ userId, spaceId }: { userId: string, spaceId: string }) {
  const defaultPropertiesInput = [...DEFAULT_MEMBER_PROPERTIES].sort().map((memberProperty, memberPropertyIndex) => ({
    createdBy: userId,
    name: MEMBER_PROPERTY_LABELS[memberProperty],
    index: memberPropertyIndex,
    type: (memberProperty as MemberPropertyType),
    updatedBy: userId,
    spaceId
  }));

  DEFAULT_CUSTOM_PROPERTIES.forEach((customMemberProperty) => {
    defaultPropertiesInput.push({
      createdBy: userId,
      name: customMemberProperty.name,
      type: customMemberProperty.type,
      index: defaultPropertiesInput.length,
      updatedBy: userId,
      spaceId
    });
  });

  return defaultPropertiesInput;
}
