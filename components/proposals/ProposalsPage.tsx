import { Box, Grid, Typography } from '@mui/material';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NewProposalButton from 'components/votes/components/NewProposalButton';
import VotesTable from 'components/votes/components/VotesTable';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useSWR from 'swr';

export default function ProposalsPage () {
  const [currentSpace] = useCurrentSpace();
  const { data, mutate: mutateVotes } = useSWR(() => `votesBySpace/${currentSpace?.id}`, () => currentSpace ? charmClient.getVotesBySpace(currentSpace.id) : [], {
    fallbackData: undefined
  });

  // For now, consider that empty pages list means we are loading pages
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
                    <NewProposalButton />
                  </Box>
                </Grid>
                <Grid item xs={12} sx={{ mt: 5 }}>
                  <VotesTable votes={data} mutateVotes={mutateVotes} />
                </Grid>
              </>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}
