import type { MemberProperty, MemberPropertyValue } from '@prisma/client';

import type { MemberPropertyValuesBySpace, PropertyValueWithDetails, PropertyValue, MemberPropertyWithSpace } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberPropertyWithSpace[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValueWithDetails[] {
  return properties.map(({ id, spaceId, type, name, space: { name: spaceName } }) => ({
    memberPropertyId: id,
    spaceId,
    spaceName,
    type,
    name,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null
  }));
}

export function groupPropertyValuesBySpace (propertyValues: PropertyValueWithDetails[]): MemberPropertyValuesBySpace[] {
  const groupedPropertyValuesMap: Record<string, MemberPropertyValuesBySpace> = {};

  propertyValues.forEach(pv => {
    if (groupedPropertyValuesMap[pv.spaceId]) {
      groupedPropertyValuesMap[pv.spaceId].properties.push(pv);
    }
    else {
      groupedPropertyValuesMap[pv.spaceId] = { spaceId: pv.spaceId, spaceName: pv.spaceName || '', properties: [pv] };
    }
  });

  return Object.values(groupedPropertyValuesMap);
}

export function mapPropertyValueWithDetails ({
  memberPropertyId,
  spaceId, value,
  memberProperty: { type, name }
}: PropertyValue & { memberProperty: MemberProperty }): PropertyValueWithDetails {
  return {
    memberPropertyId,
    spaceId,
    value,
    type,
    name
  };

}
