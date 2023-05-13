import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesForm } from 'components/common/UserProfile/components/MemberPropertiesForm';
import { useMemberPropertyValues } from 'components/common/UserProfile/hooks/useMemberPropertyValues';
import { UserProfileDialog } from 'components/common/UserProfile/UserProfileDialog';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

import { SpaceDetailsAccordion } from './components/SpaceDetailsAccordion';

type Props = {
  memberId: string;
};

export function UserSpaceDetails({ memberId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile, updateSpaceValues } = useMemberPropertyValues(memberId);
  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);
  const { query } = useRouter();
  const { user } = useUser();
  const readOnly = memberId !== user?.id;

  const expandedWorkspaceIndex = memberPropertyValues.findIndex((mpv) => mpv.spaceId === query.workspace);

  // make sure the expanded workspace is always at the top
  const propertyValues =
    expandedWorkspaceIndex !== -1
      ? [
          memberPropertyValues[expandedWorkspaceIndex],
          ...memberPropertyValues.slice(0, expandedWorkspaceIndex),
          ...memberPropertyValues.slice(expandedWorkspaceIndex + 1)
        ]
      : memberPropertyValues;

  return (
    <Box mt={4} mb={2}>
      <Legend noBorder>My Charmverse Spaces</Legend>
      <LoadingComponent minHeight={100} isLoading={isLoading} />
      {propertyValues.map((pv) => (
        <SpaceDetailsAccordion
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
            memberId={memberId}
            spaceId={editSpaceId}
            updateMemberPropertyValues={updateSpaceValues}
          />
        </UserProfileDialog>
      )}
    </Box>
  );
}
