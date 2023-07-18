import type { MemberPropertyType } from '@charmverse/core/prisma-client';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';

import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';
import { MemberProperties } from '../MemberProperties';

import { ProfileWidget } from './ProfileWidget';

export function MemberPropertiesWidget({ userId }: { userId: string }) {
  const { memberPropertyValues, isLoading } = useMemberPropertyValues(userId);
  const { space } = useCurrentSpace();

  const { getDisplayProperties } = useMemberProperties();

  const visibleProperties = getDisplayProperties('profile');

  const currentSpacePropertyValues = memberPropertyValues?.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  const currentSpacePropertyNonEmptyValues = (
    currentSpacePropertyValues?.properties.filter((propertyValue) =>
      visibleProperties.some((prop) => prop.id === propertyValue.memberPropertyId)
    ) ?? []
  ).filter(
    (property) =>
      (Array.isArray(property.value) ? property.value.length !== 0 : !!property.value) &&
      // These are not shown in member properties, so even if their value exist we don't want to show them
      !(['bio', 'discord', 'twitter', 'linked_in', 'github', 'timezone'] as MemberPropertyType[]).includes(
        property.type
      )
  );

  return (
    <ProfileWidget
      isLoading={isLoading}
      emptyContent={
        !space ||
        !memberPropertyValues ||
        !currentSpacePropertyValues ||
        currentSpacePropertyValues.properties.length === 0 ||
        currentSpacePropertyNonEmptyValues.length === 0
          ? 'User does not have any member properties added'
          : null
      }
      title='CharmVerse Details'
    >
      <MemberProperties properties={currentSpacePropertyNonEmptyValues} />
    </ProfileWidget>
  );
}
