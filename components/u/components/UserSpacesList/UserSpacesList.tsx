import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesForm } from 'components/common/UserProfile/components/MemberPropertiesForm';
import { useMemberPropertyValues } from 'components/common/UserProfile/hooks/useMemberPropertyValues';
import { UserProfileDialog } from 'components/common/UserProfile/UserProfileDialog';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { UserSpaceListItem } from './components/UserSpaceListItem';

type Props = {
  userId: string;
};

export function UserSpacesList({ userId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile, updateSpaceValues, refreshPropertyValues } =
    useMemberPropertyValues(userId);
  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);
  const { query } = useRouter();
  const { user } = useUser();
  const readOnly = userId !== user?.id;

  const expandedWorkspaceIndex = memberPropertyValues?.findIndex((mpv) => mpv.spaceId === query.workspace) || -1;

  // make sure the expanded workspace is always at the top
  const propertyValues =
    memberPropertyValues && expandedWorkspaceIndex !== -1
      ? [
          memberPropertyValues[expandedWorkspaceIndex],
          ...memberPropertyValues.slice(0, expandedWorkspaceIndex),
          ...memberPropertyValues.slice(expandedWorkspaceIndex + 1)
        ]
      : memberPropertyValues || [];

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === editSpaceId)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, editSpaceId]
  );

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  async function saveForm() {
    if (editSpaceId) {
      await updateSpaceValues(editSpaceId, memberDetails);
    }
    setMemberDetails([]);
  }

  const isFormClean = memberDetails.length === 0;

  return (
    <Box mt={2} mb={2}>
      <Legend noBorder>My CharmVerse Spaces</Legend>
      <LoadingComponent minHeight={100} isLoading={isLoading} />
      {propertyValues.map((pv) => (
        <UserSpaceListItem
          key={pv.spaceId}
          spaceName={pv.spaceName}
          spaceImage={pv.spaceImage}
          properties={pv.properties}
          readOnly={!canEditSpaceProfile(pv.spaceId) || readOnly}
          onEdit={() => setEditSpaceId(pv.spaceId)}
          expanded={query.workspace === pv.spaceId}
        />
      ))}

      {editSpaceId && (
        <UserProfileDialog title='Edit space profile' onClose={() => setEditSpaceId(null)}>
          <MemberPropertiesForm
            properties={memberProperties}
            userId={userId}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberDetailsChange}
          />
          <Box display='flex' justifyContent='flex-end' mt={2}>
            <Button disableElevation size='large' disabled={isFormClean} onClick={saveForm}>
              Save
            </Button>
          </Box>
        </UserProfileDialog>
      )}
    </Box>
  );
}
