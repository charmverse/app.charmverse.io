import type { MemberPropertyType, Prisma } from '@charmverse/core/prisma-client';
import {
  DEFAULT_MEMBER_PROPERTIES,
  HIDDEN_MEMBER_PROPERTIES,
  MEMBER_PROPERTY_CONFIG
} from '@packages/lib/members/constants';

export function generateDefaultPropertiesInput({
  userId,
  spaceId,
  addNameProperty = false
}: {
  addNameProperty?: boolean;
  userId: string;
  spaceId: string;
}): Prisma.MemberPropertyCreateManyInput[] {
  const defaultPropertiesInput = DEFAULT_MEMBER_PROPERTIES.map((memberProperty) => ({
    createdBy: userId,
    name: MEMBER_PROPERTY_CONFIG[memberProperty].label,
    type: memberProperty,
    updatedBy: userId,
    spaceId,
    enabledViews: HIDDEN_MEMBER_PROPERTIES.includes(memberProperty) ? [] : undefined
  }));

  return (
    addNameProperty
      ? [
          {
            createdBy: userId,
            name: 'Name',
            type: 'text' as MemberPropertyType,
            updatedBy: userId,
            spaceId,
            enabledViews: undefined
          },
          ...defaultPropertiesInput
        ]
      : defaultPropertiesInput
  ).map((property, index) => ({
    ...property,
    index
  }));
}
