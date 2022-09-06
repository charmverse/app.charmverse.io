import { Box, Grid, Typography } from '@mui/material';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NewProposalButton from 'components/votes/components/NewProposalButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useSWR from 'swr';
import ProposalsTable from './components/ProposalsTable';

export default function ProposalsPage () {
  const [currentSpace] = useCurrentSpace();

  const { data, mutate: mutateProposals } = useSWR(() => currentSpace ? `proposals/${currentSpace.id}` : null, () => charmClient.proposals.getProposalsBySpace(currentSpace!.id));

  const loadingData = !data;

  return (
    <CenteredPageContent>
      <Grid container mb={6}>
        <Grid item xs>
          <Typography variant='h1' gutterBottom>
            Proposals
          </Typography>
        </Grid>

        {
            loadingData ? (
              <Grid item xs={12} sx={{ mt: 12 }}>
                <LoadingComponent isLoading size={50} />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} lg={8} display='flex'>
                  <Box gap={3} sx={{ display: 'flex', alignItems: { xs: 'flex-start', lg: 'center' }, width: '100%', justifyContent: { xs: 'flex-start', lg: 'flex-end' }, flexDirection: { xs: 'column-reverse', lg: 'row' } }}>
                    <NewProposalButton mutateProposals={mutateProposals} />
                  </Box>
                </Grid>
                <Grid item xs={12} sx={{ mt: 5 }}>
                  <ProposalsTable proposals={data} mutateProposals={mutateProposals} />
                </Grid>
              </>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}
