import { Divider, Grid } from '@mui/material';
import { Stack } from '@mui/system';

import { useGetUserProposals } from 'charmClient/hooks/proposals';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { ActionableProposalsTable } from './ActionableProposalsTable';
import { ProposalsTable } from './ProposalsTable';

export function UserProposalsTables() {
  const { space } = useCurrentSpace();
  const { data: proposals, isLoading } = useGetUserProposals({
    spaceId: space?.id
  });
  const { getFeatureTitle } = useSpaceFeatures();

  return (
    <Stack gap={2} mt={2} minWidth={1000}>
      {isLoading || !proposals ? (
        <Grid item xs={12} sx={{ mt: 12 }}>
          <LoadingComponent height={500} isLoading size={50} />
        </Grid>
      ) : (
        <Stack gap={3}>
          <ActionableProposalsTable proposals={proposals.actionable} />
          {proposals.authored.length ? (
            <ProposalsTable proposals={proposals.authored} title={`My ${getFeatureTitle('Proposals')}`} />
          ) : null}
          {proposals.assigned.length ? <ProposalsTable proposals={proposals.assigned} title='Assigned to me' /> : null}
        </Stack>
      )}
    </Stack>
  );
}
