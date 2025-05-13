import type { MemberPropertyType } from '@charmverse/core/prisma-client';
import { Edit as EditIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/components/WorkspaceAvatar';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { MemberPropertyValuesBySpace } from '@packages/lib/members/interfaces';

import { ProfileWidget } from '../ProfileWidget';

import { MemberProperties } from './MemberProperties';
import { MemberPropertiesFormDialog } from './MemberPropertiesFormDialog';

export function MemberPropertiesWidget({
  memberPropertyValues,
  readOnly,
  userId
}: {
  userId: string;
  readOnly: boolean;
  memberPropertyValues: MemberPropertyValuesBySpace[];
}) {
  const [showPropertiesForm, setShowPropertiesForm] = useState<boolean>(false);
  const { user } = useUser();
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
          value: member.roles.map((role) => role.name) as string[]
        };
      }

      return currentSpaceProperty;
    })
    .filter(
      (property) =>
        (Array.isArray(property.value) ? property.value.length !== 0 : !!property.value) &&
        // These are not shown in member properties, so even if their value exist we don't want to show them
        !(['bio', 'discord', 'timezone'] as MemberPropertyType[]).includes(property.type)
    );

  function openPropertiesForm() {
    setShowPropertiesForm(true);
  }
  function hidePropertiesForm() {
    setShowPropertiesForm(false);
  }

  return (
    <>
      <ProfileWidget
        avatarComponent={space && <WorkspaceAvatar name={space?.name} image={space?.spaceImage} size='small' />}
        linkComponent={
          !readOnly && (
            <Tooltip title='Edit profile'>
              <span>
                <IconButton size='small' color='secondary' onClick={openPropertiesForm}>
                  <EditIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
          )
        }
        title={space ? `${space?.name} Profile` : ' '}
      >
        <MemberProperties properties={currentSpacePropertyNonEmptyValues} />
      </ProfileWidget>
      {showPropertiesForm && space && user && (
        <MemberPropertiesFormDialog userId={userId} onClose={hidePropertiesForm} />
      )}
    </>
  );
}
