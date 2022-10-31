import { Box } from '@mui/system';
import { useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails ({ memberId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile, updateSpaceValues } = useMemberPropertyValues(memberId);
  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  if (!memberPropertyValues?.length) {
    return null;
  }

  return (
    <Box mt={2}>
      {memberPropertyValues.map(pv => (
        <SpaceDetailsAccordion
          key={pv.spaceId}
          spaceName={pv.spaceName}
          spaceImage={pv.spaceImage}
          properties={pv.properties}
          readOnly={!canEditSpaceProfile(pv.spaceId)}
          onEdit={() => setEditSpaceId(pv.spaceId)}
        />
      ))}

      <MemberPropertiesPopupForm
        onClose={() => setEditSpaceId(null)}
        memberId={memberId}
        spaceId={editSpaceId}
        updateMemberPropertyValues={updateSpaceValues}
      />
    </Box>
  );
}

