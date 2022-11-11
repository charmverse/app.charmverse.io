import { Box, Grid, Typography } from '@mui/material';
import { useEffect } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useProposalSortAndFilters } from 'components/proposals/hooks/useProposalSortAndFilters';
import NewProposalButton from 'components/votes/components/NewProposalButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import ProposalsTable from './components/ProposalsTable';
import ProposalsViewOptions from './components/ProposalsViewOptions';

export default function ProposalsPage () {
  const { categories = [] } = useProposalCategories();
  const currentSpace = useCurrentSpace();
  const { data, mutate: mutateProposals } = useSWR(() => currentSpace ? `proposals/${currentSpace.id}` : null, () => charmClient.proposals.getProposalsBySpace(currentSpace!.id));
  const {
    filteredProposals,
    proposalFilter,
    proposalSort,
    setProposalFilter,
    setProposalSort,
    categoryIdFilter,
    setCategoryIdFilter
  } = useProposalSortAndFilters(data ?? []);

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: currentSpace?.id, type: 'proposals_list' });
  }, []);

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
                      categoryIdFilter={categoryIdFilter}
                      setCategoryIdFilter={setCategoryIdFilter}
                      categories={categories}
                    />
                    <NewProposalButton mutateProposals={mutateProposals} />
                  </Box>
                </Grid>
                <Grid item xs={12} sx={{ mt: 5 }}>
                  {data?.length === 0 && (
                    <EmptyStateVideo
                      description='Getting started with proposals'
                      videoTitle='Proposals | Getting started with Charmverse'
                      videoUrl='https://tiny.charmverse.io/proposal-builder'
                    />
                  )}
                  {data?.length > 0 && (
                    <ProposalsTable proposals={filteredProposals} mutateProposals={mutateProposals} />
                  )}
                </Grid>
              </>
            )
          }
      </Grid>
    </CenteredPageContent>
  );
}
