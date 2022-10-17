import { Box } from '@mui/system';
import React from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import { SpaceDetailsAccordion } from 'components/profile/components/SpacesMemberDetails/components/SpaceDetailsAccordion';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';

type Props = {
  memberId: string;
};

export function SpacesMemberDetails ({ memberId }: Props) {
  const { isLoading, memberPropertyValues } = useMemberPropertyValues(memberId);

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
          properties={pv.properties}
        />
      ))}
    </Box>
  );
}

