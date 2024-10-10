import { Grid, Stack } from '@mui/material';

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
          <ActionableProposalsTable proposals={proposals.actionable} customColumns={proposals?.customColumns} />
          {proposals.authored.length ? (
            <ProposalsTable
              proposals={proposals.authored}
              title={`My ${getFeatureTitle('Proposals')}`}
              customColumns={proposals?.customColumns}
            />
          ) : null}
          {proposals.review_completed.length ? (
            <ProposalsTable
              proposals={proposals.review_completed}
              title='Review completed'
              customColumns={proposals?.customColumns}
            />
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}
