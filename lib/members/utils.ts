import type { MemberProperty, MemberPropertyValue, Space } from '@prisma/client';

import type { MemberPropertyValuesBySpace, MemberPropertyWithSpace, PropertyValueWithDetails } from 'lib/members/interfaces';

export function getPropertiesWithValues (properties: MemberPropertyWithSpace[], propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[]): PropertyValueWithDetails[] {
  return properties.map(({ enabledViews, id, spaceId, type, name, space: { name: spaceName, spaceImage } }) => ({
    memberPropertyId: id,
    spaceId,
    spaceName,
    spaceImage,
    type,
    name,
    value: propertyValues.find(pv => pv.memberPropertyId === id)?.value || null,
    enabledViews
  }));
}

export function groupPropertyValuesBySpace (propertyValues: PropertyValueWithDetails[]): MemberPropertyValuesBySpace[] {
  const groupedPropertyValuesMap: Record<string, MemberPropertyValuesBySpace> = {};

  propertyValues.forEach(pv => {
    if (groupedPropertyValuesMap[pv.spaceId]) {
      groupedPropertyValuesMap[pv.spaceId].properties.push(pv);
    }
    else {
      groupedPropertyValuesMap[pv.spaceId] = { spaceId: pv.spaceId, spaceName: pv.spaceName || '', properties: [pv], spaceImage: pv.spaceImage || '' };
    }
  });

  return Object.values(groupedPropertyValuesMap);
}

export function mapPropertyValueWithDetails ({
  memberPropertyId,
  spaceId,
  value,
  memberProperty: { type, name, enabledViews },
  space: { spaceImage }
}: MemberPropertyValue & { memberProperty: MemberProperty, space: Space }): PropertyValueWithDetails {
  return {
    memberPropertyId,
    spaceId,
    value,
    type,
    name,
    spaceImage,
    enabledViews
  };

}
