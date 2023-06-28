import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';

import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';
import { MemberProperties } from '../MemberProperties';

import { ProfileWidget } from './ProfileWidget';

export function SpaceMemberPropertyWidget({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();
  const { memberPropertyValues = [] } = useMemberPropertyValues(userId);
  const { getDisplayProperties } = useMemberProperties();

  const visibleProperties = getDisplayProperties('profile');

  if (!space) {
    return null;
  }

  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  if (currentSpacePropertyValues?.properties) {
    currentSpacePropertyValues.properties = currentSpacePropertyValues.properties.filter((propertyValue) => {
      return visibleProperties.some((prop) => prop.id === propertyValue.memberPropertyId);
    });
  }

  return (
    <ProfileWidget title='CharmVerse Details'>
      <MemberProperties properties={currentSpacePropertyValues?.properties ?? []} />
    </ProfileWidget>
  );
}
