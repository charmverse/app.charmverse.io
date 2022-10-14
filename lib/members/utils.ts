import type { MemberProperty, MemberPropertyValue } from '@prisma/client';

import type { PropertyValue } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberProperty[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValue[] {
  return properties.map(({ id, spaceId }) => ({
    memberPropertyId: id,
    spaceId,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}

