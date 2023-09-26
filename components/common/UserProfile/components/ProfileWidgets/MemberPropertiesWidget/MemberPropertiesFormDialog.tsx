import { Box } from '@mui/material';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import { useMemberPropertyValues } from 'components/common/UserProfile/hooks/useMemberPropertyValues';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { UserProfileDialog } from '../../../UserProfileDialog';

import { MemberPropertiesForm } from './MemberPropertiesForm';

type Props = {
  spaceId: string;
  userId: string;
  onClose: VoidFunction;
};

export function MemberPropertiesFormDialog({ spaceId, userId, onClose }: Props) {
  const { memberPropertyValues, updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(userId);
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);

  async function saveForm() {
    await updateSpaceValues(spaceId, memberDetails);
    onClose();
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === spaceId)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, spaceId]
  );

  const isFormClean = memberDetails.length === 0;
  return (
    <UserProfileDialog title='Edit profile' onClose={onClose}>
      <MemberPropertiesForm
        properties={memberProperties}
        userId={userId}
        refreshPropertyValues={refreshPropertyValues}
        onChange={onMemberDetailsChange}
      />
      <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
        <Button disableElevation color='secondary' variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button disableElevation disabled={isFormClean} onClick={saveForm}>
          Save
        </Button>
      </Box>
    </UserProfileDialog>
  );
}
