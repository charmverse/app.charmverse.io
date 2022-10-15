import type { MemberProperty, MemberPropertyValue } from '@prisma/client';

import type { MemberPropertyValuesBySpace, PropertyValue } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberProperty[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValue[] {
  return properties.map(({ id, spaceId }) => ({
    memberPropertyId: id,
    spaceId,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}

export function groupPropertyValuesBySpace (propertyValues: PropertyValue[]): MemberPropertyValuesBySpace[] {
  const groupedPropertyValuesMap: Record<string, MemberPropertyValuesBySpace> = {};

  propertyValues.forEach(pv => {
    if (groupedPropertyValuesMap[pv.spaceId]) {
      groupedPropertyValuesMap[pv.spaceId].properties.push(pv);
    }
    else {
      groupedPropertyValuesMap[pv.spaceId] = { spaceId: pv.spaceId, properties: [pv] };
    }
  });

  return Object.values(groupedPropertyValuesMap);
}
