import type { MemberProperty, MemberPropertyValue } from '@prisma/client';

import type { PropertyValue } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberProperty[], propertyValues: MemberPropertyValue[]): PropertyValue[] {
  return properties.map(({ id, type, name }) => ({
    id,
    type,
    name,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}
