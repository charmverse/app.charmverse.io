import { Box, Grid, Typography } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { NewProposalButton } from 'components/proposals/components/NewProposalButton';
import { ProposalsBoard } from 'components/proposals/components/ProposalsBoard/ProposalsBoard';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { ProposalDialogProvider } from './components/ProposalDialog/hooks/useProposalDialog';
import ProposalDialogGlobal from './components/ProposalDialog/ProposalDialogGlobal';
import { ProposalsViewOptions } from './components/ProposalViewOptions/ProposalsViewOptions';
import { useProposalCategories } from './hooks/useProposalCategories';
import { useProposals } from './hooks/useProposals';

export function ProposalsPage({ title }: { title: string }) {
  const { categories = [] } = useProposalCategories();
  const { space: currentSpace } = useCurrentSpace();
  const { isFreeSpace } = useIsFreeSpace();

  const { statusFilter, setStatusFilter, categoryIdFilter, setCategoryIdFilter, proposals } = useProposals();

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
    <div className='focalboard-body full-page'>
      <Box className='BoardComponent' py={(theme) => theme.spacing(8)}>
        <ProposalDialogProvider>
          <div className='top-head'>
            <Grid container mb={6}>
              <Grid item xs={12}>
                <Box display='flex' alignItems='flex-start' justifyContent='space-between'>
                  <Typography variant='h1' gutterBottom>
                    {title}
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
                      <NewProposalButton />

                      <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
                        <ProposalsViewOptions
                          statusFilter={statusFilter}
                          setStatusFilter={setStatusFilter}
                          categoryIdFilter={categoryIdFilter}
                          setCategoryIdFilter={setCategoryIdFilter}
                          categories={categories}
                          // Playwright-specific
                          testKey='desktop'
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
            </Grid>
          </div>

          {loadingData ? (
            <Grid item xs={12} sx={{ mt: 12 }}>
              <LoadingComponent height={500} isLoading size={50} />
            </Grid>
          ) : (
            <Grid item xs={12}>
              {proposals?.length === 0 && (
                <Box sx={{ mt: 5 }}>
                  <EmptyStateVideo
                    description='Getting started with proposals'
                    videoTitle='Proposals | Getting started with CharmVerse'
                    videoUrl='https://tiny.charmverse.io/proposal-builder'
                  />
                </Box>
              )}
              {proposals?.length > 0 && (
                <Box className='container-container'>
                  <ProposalsBoard />
                </Box>
              )}
            </Grid>
          )}
          <ProposalDialogGlobal />
        </ProposalDialogProvider>
      </Box>
    </div>
  );
}
