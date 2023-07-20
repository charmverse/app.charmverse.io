import type { MemberPropertyType } from '@charmverse/core/prisma-client';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { MemberPropertyValuesBySpace } from 'lib/members/interfaces';

import { MemberProperties } from '../MemberProperties';

import { ProfileWidget } from './ProfileWidget';

export function MemberPropertiesWidget({
  memberPropertyValues,
  userId
}: {
  userId: string;
  memberPropertyValues: MemberPropertyValuesBySpace[];
}) {
  const { space } = useCurrentSpace();
  const { members } = useMembers();
  const { getDisplayProperties } = useMemberProperties();
  const member = members.find((_member) => _member.id === userId);

  const visibleProperties = getDisplayProperties('profile');

  const currentSpacePropertyValues = memberPropertyValues?.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  const currentSpacePropertyNonEmptyValues = (
    currentSpacePropertyValues?.properties.filter((propertyValue) =>
      visibleProperties.some((prop) => prop.id === propertyValue.memberPropertyId)
    ) ?? []
  )
    .map((currentSpaceProperty) => {
      if (currentSpaceProperty.type === 'role' && member) {
        return {
          ...currentSpaceProperty,
          value: [
            ...(currentSpaceProperty.value as string[]),
            member.isAdmin ? 'Admin' : member.isGuest ? 'Guest' : 'Member'
          ]
        };
      }

      return currentSpaceProperty;
    })
    .filter(
      (property) =>
        (Array.isArray(property.value) ? property.value.length !== 0 : !!property.value) &&
        // These are not shown in member properties, so even if their value exist we don't want to show them
        !(['bio', 'discord', 'twitter', 'linked_in', 'github', 'timezone'] as MemberPropertyType[]).includes(
          property.type
        )
    );

  return (
    <ProfileWidget title='CharmVerse Details'>
      <MemberProperties properties={currentSpacePropertyNonEmptyValues} />
    </ProfileWidget>
  );
}
