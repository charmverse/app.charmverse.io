import type { MemberProperty, MemberPropertyValue, Space } from '@charmverse/core/prisma';
import type { MemberPropertyValuesBySpace, PropertyValueWithDetails } from '@packages/lib/members/interfaces';

type MemberPropertyWithSpace = MemberProperty & {
  space: Space;
};

type Options = {
  withSpaceDetails?: boolean;
};

export function getPropertiesWithValues(
  properties: MemberPropertyWithSpace[],
  propertyValues: Pick<MemberPropertyValue, 'value' | 'memberPropertyId'>[],
  { withSpaceDetails }: Options = {}
): PropertyValueWithDetails[] {
  return properties.map(
    ({ enabledViews, id, spaceId, type, name, options, space: { name: spaceName, spaceImage }, required }) => {
      const propertyValue: PropertyValueWithDetails = {
        memberPropertyId: id,
        spaceId,
        type,
        name,
        value: propertyValues.find((pv) => pv.memberPropertyId === id)?.value || null,
        options: options as [],
        enabledViews,
        required
      };

      if (withSpaceDetails) {
        propertyValue.spaceName = spaceName;
        propertyValue.spaceImage = spaceImage;
      }

      return propertyValue;
    }
  );
}

export function groupPropertyValuesBySpace(propertyValues: PropertyValueWithDetails[]): MemberPropertyValuesBySpace[] {
  const groupedPropertyValuesMap: Record<string, MemberPropertyValuesBySpace> = {};

  propertyValues.forEach((pv) => {
    const { spaceName, spaceImage, ...pvalue } = pv;
    if (groupedPropertyValuesMap[pv.spaceId]) {
      groupedPropertyValuesMap[pv.spaceId].properties.push(pvalue);
    } else {
      groupedPropertyValuesMap[pv.spaceId] = {
        spaceId: pv.spaceId,
        spaceName: spaceName || '',
        spaceImage: spaceImage || '',
        properties: [pvalue]
      };
    }
  });

  return Object.values(groupedPropertyValuesMap);
}

export function mapPropertyValueWithDetails({
  memberPropertyId,
  spaceId,
  value,
  memberProperty: { type, name, enabledViews, required },
  space: { spaceImage }
}: MemberPropertyValue & { memberProperty: MemberProperty; space: Space }): PropertyValueWithDetails {
  return {
    memberPropertyId,
    spaceId,
    value,
    type,
    name,
    spaceImage,
    enabledViews,
    required
  };
}
