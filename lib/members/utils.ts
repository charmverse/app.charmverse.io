import type { MemberProperty, MemberPropertyValue } from '@prisma/client';

import type { PropertyValue } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberProperty[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValue[] {
  return properties.map(({ id, type, name }) => ({
    id,
    type,
    name,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}

export const DEFAULT_MEMBER_PROPERTIES = [
  'profile_pic',
  'name',
  'role',
  'discord',
  'twitter',
  'timezone'
] as const;
