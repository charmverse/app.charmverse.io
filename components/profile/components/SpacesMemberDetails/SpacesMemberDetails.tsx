import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import { useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import {
  MemberProperties,
  MemberPropertiesPopup
} from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import Legend from 'components/settings/Legend';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useUser } from 'hooks/useUser';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails({ memberId }: Props) {
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
        <MemberPropertiesPopup
          title='Edit space profile'
          onClose={() => setEditSpaceId(null)}
          memberId={memberId}
          spaceId={editSpaceId}
        >
          <MemberProperties memberId={memberId} spaceId={editSpaceId} updateMemberPropertyValues={updateSpaceValues} />
        </MemberPropertiesPopup>
      )}
    </Box>
  );
}
