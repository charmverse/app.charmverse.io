import { Box, Grid, Typography } from '@mui/material';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NewProposalButton from 'components/votes/components/NewProposalButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useState } from 'react';
import useSWR from 'swr';
import ProposalsTable from './components/ProposalsTable';
import type { ProposalFilter, ProposalSort } from './components/ProposalsViewOptions';
import ProposalsViewOptions from './components/ProposalsViewOptions';

export default function ProposalsPage () {
  const [currentSpace] = useCurrentSpace();
  const [proposalSort, setProposalSort] = useState<ProposalSort>('latest_created');
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('all');
  const { pages } = usePages();
  const { data, mutate: mutateProposals } = useSWR(() => currentSpace ? `proposals/${currentSpace.id}` : null, () => charmClient.proposals.getProposalsBySpace(currentSpace!.id));

  let proposals = data ?? [];

  if (proposalFilter !== 'all') {
    proposals = proposals.filter(proposal => proposal.status === proposalFilter);
  }

  proposals = proposals.sort((p1, p2) => {
    const page1 = pages[p1.id];
    const page2 = pages[p2.id];

    return (page1?.createdAt ?? 0) > (page2?.createdAt ?? 0) ? -1 : 1;
  });

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
                    <ProposalsViewOptions
                      proposalFilter={proposalFilter}
                      setProposalFilter={setProposalFilter}
                      proposalSort={proposalSort}
                      setProposalSort={setProposalSort}
                    />
                    <NewProposalButton mutateProposals={mutateProposals} />
                  </Box>
                </Grid>
                <Grid item xs={12} sx={{ mt: 5 }}>
                  <ProposalsTable proposals={proposals} mutateProposals={mutateProposals} />
                </Grid>
              </>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}
