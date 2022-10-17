import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesForm';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails ({ memberId }: Props) {
  const { isLoading, memberPropertyValues, canEditSpaceProfile } = useMemberPropertyValues(memberId);
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
          memberId={memberId}
          spaceId={pv.spaceId}
          spaceName={pv.spaceName}
          spaceImage={pv.spaceImage}
          properties={pv.properties}
          readOnly={!canEditSpaceProfile(pv.spaceId)}
          onEdit={() => setEditSpaceId(pv.spaceId)}
        />
      ))}

      <Dialog open={!!editSpaceId} onClose={() => setEditSpaceId(null)} fullWidth>
        <DialogTitle>Edit workspace profile</DialogTitle>
        <DialogContent dividers>
          <MemberPropertiesForm memberId={memberId} spaceId={editSpaceId} updateMemberPropertyValues={() => Promise.resolve()} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

