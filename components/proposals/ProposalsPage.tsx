import { Box, Grid, Typography } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { NewProposalButton } from 'components/votes/components/NewProposalButton';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { ProposalDialogProvider } from './components/ProposalDialog/hooks/useProposalDialog';
import ProposalDialogGlobal from './components/ProposalDialog/ProposalDialogGlobal';
import { ProposalsTable } from './components/ProposalsTable';
import { ProposalsViewOptions } from './components/ProposalsViewOptions';
import { useProposalCategories } from './hooks/useProposalCategories';
import { useProposals } from './hooks/useProposals';

export function ProposalsPage() {
  const { categories = [] } = useProposalCategories();
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();

  const {
    filteredProposals,
    statusFilter,
    setStatusFilter,
    categoryIdFilter,
    setCategoryIdFilter,
    proposals,
    mutateProposals,
    isLoading
  } = useProposals();
  useEffect(() => {
    if (currentSpace?.id) {
      charmClient.track.trackAction('page_view', { spaceId: currentSpace.id, type: 'proposals_list' });
    }
  }, [currentSpace?.id]);

  const loadingData = !proposals;

  const { hasAccess, isLoadingAccess } = useHasMemberLevel('member');

  const canSeeProposals = hasAccess || isFreeSpace || currentSpace?.publicProposals === true;

  if (isLoadingAccess) {
    return null;
  }

  if (!canSeeProposals) {
    return <ErrorPage message='You cannot access proposals for this space' />;
  }

  return (
    <CenteredPageContent>
      <ProposalDialogProvider>
        <Grid container mb={6}>
          <Grid item xs={12}>
            <Box display='flex' alignItems='flex-start' justifyContent='space-between'>
              <Typography variant='h1' gutterBottom>
                Proposals
              </Typography>

              <Box display='flex'>
                <Box
                  gap={3}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    flexDirection: 'row-reverse'
                  }}
                >
                  <NewProposalButton mutateProposals={mutateProposals} />

                  <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
                    <ProposalsViewOptions
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      categoryIdFilter={categoryIdFilter}
                      setCategoryIdFilter={setCategoryIdFilter}
                      categories={categories}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'flex-end' }}>
              <ProposalsViewOptions
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryIdFilter={categoryIdFilter}
                setCategoryIdFilter={setCategoryIdFilter}
                categories={categories}
              />
            </Box>
          </Grid>

          {loadingData ? (
            <Grid item xs={12} sx={{ mt: 12 }}>
              <LoadingComponent isLoading size={50} />
            </Grid>
          ) : (
            <Grid item xs={12} sx={{ mt: 5 }}>
              {proposals?.length === 0 && (
                <EmptyStateVideo
                  description='Getting started with proposals'
                  videoTitle='Proposals | Getting started with Charmverse'
                  videoUrl='https://tiny.charmverse.io/proposal-builder'
                />
              )}
              {proposals?.length > 0 && (
                <ProposalsTable
                  isLoading={isLoading}
                  proposals={filteredProposals ?? []}
                  mutateProposals={mutateProposals}
                />
              )}
            </Grid>
          )}
        </Grid>
        <ProposalDialogGlobal />
      </ProposalDialogProvider>
    </CenteredPageContent>
  );
}
