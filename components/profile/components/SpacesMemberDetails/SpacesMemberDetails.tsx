import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesPopup } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopup';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails({ memberId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile, updateSpaceValues } = useMemberPropertyValues(memberId);
  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);
  const { query } = useRouter();

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  if (!memberPropertyValues?.length) {
    return null;
  }

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
    <Box mt={2}>
      {propertyValues.map((pv) => (
        <SpaceDetailsAccordion
          key={pv.spaceId}
          spaceName={pv.spaceName}
          spaceImage={pv.spaceImage}
          properties={pv.properties}
          readOnly={!canEditSpaceProfile(pv.spaceId)}
          onEdit={() => setEditSpaceId(pv.spaceId)}
          expanded={query.workspace === pv.spaceId}
        />
      ))}

      <MemberPropertiesPopup
        onClose={() => setEditSpaceId(null)}
        memberId={memberId}
        spaceId={editSpaceId}
        updateMemberPropertyValues={updateSpaceValues}
      />
    </Box>
  );
}
