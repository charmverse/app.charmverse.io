import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Button from 'components/common/Button';
import GridContainer from 'components/common/Grid/GridContainer';
import GridHeader from 'components/common/Grid/GridHeader';
import LoadingComponent from 'components/common/LoadingComponent';
import { useTasks } from 'components/nexus/hooks/useTasks';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { usePages } from 'hooks/usePages';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import NoProposalsMessage from './NoProposalsMessage';
import ProposalActionsMenu from './ProposalActionsMenu';
import { ProposalCategoryChip } from './ProposalChip';
import { useProposalDialog } from './ProposalDialog/hooks/useProposalDialog';
import { ProposalStatusChip } from './ProposalStatusBadge';

export function ProposalsTable({
  proposals,
  mutateProposals,
  isLoading
}: {
  isLoading?: boolean;
  proposals: ProposalWithUsers[];
  mutateProposals: () => void;
}) {
  const { pages, deletePage } = usePages();
  const { mutate: mutateTasks } = useTasks();
  const { showProposal } = useProposalDialog();
  const router = useRouter();
  const { formatDateTime, formatDate } = useDateFormatter();

  function onClose() {
    setUrlWithoutRerender(router.pathname, { id: null });
    mutateProposals();
    mutateTasks();
  }

  function openPage(pageId: string) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, id: pageId }
    });
  }

  async function deleteProposal(proposalId: string) {
    await deletePage({ pageId: proposalId });
    mutateProposals();
    mutateTasks();
  }

  useEffect(() => {
    if (router.isReady && typeof router.query.id === 'string') {
      showProposal({
        pageId: router.query.id,
        onClose
      });
    }
  }, [router.isReady, router.query.id]);

  return (
    <>
      <GridHeader>
        <Grid item xs={6} md={5}>
          Title
        </Grid>
        <Grid item xs={4} md={2} display='flex' justifyContent='center'>
          Status
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Category
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Created
        </Grid>
        <Grid item xs={1} display='flex' justifyContent='center'></Grid>
      </GridHeader>
      {isLoading && <LoadingComponent height='250px' isLoading />}
      {proposals.length === 0 && (
        <Box height='250px' mt={2}>
          <NoProposalsMessage message='There are no proposals yet. Create a proposal page to get started!' />
        </Box>
      )}
      {proposals.map((proposal) => {
        const { category } = proposal;
        const proposalPage = pages[proposal.id];
        return proposalPage ? (
          <GridContainer key={proposal.id}>
            <Grid data-test={`proposal-row-${proposal.id}`} item xs={6} md={5} sx={{ cursor: 'pointer' }}>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
                onClick={() => openPage(proposal.id)}
              >
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>
                    <TaskOutlinedIcon color='secondary' />
                  </Box>
                  <div>
                    <Typography>
                      <strong>{pages[proposal.id]?.title || 'Untitled'}</strong>
                    </Typography>
                  </div>
                </Box>
                <Button
                  data-test={`open-proposal-${proposal.id}`}
                  className='show-on-hover'
                  color='secondary'
                  variant='outlined'
                  size='small'
                >
                  Open
                </Button>
              </Box>
            </Grid>
            <Grid item xs={4} md={2} display='flex' justifyContent='center'>
              <ProposalStatusChip status={proposal.status} />
            </Grid>
            <Grid
              item
              xs={2}
              md={2}
              display='flex'
              justifyContent='center'
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {category ? <ProposalCategoryChip size='small' color={category.color} title={category.title} /> : '-'}
            </Grid>
            <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} display='flex' justifyContent='center'>
              <Tooltip arrow placement='top' title={`Created on ${formatDateTime(proposalPage.createdAt)}`}>
                <span>{formatDate(proposalPage.createdAt)}</span>
              </Tooltip>
            </Grid>
            <Grid item xs={1} display='flex' justifyContent='flex-end'>
              <ProposalActionsMenu
                page={proposalPage}
                deleteProposal={deleteProposal}
                editProposal={(proposalId) => openPage(proposalId)}
                proposal={proposal}
              />
            </Grid>
          </GridContainer>
        ) : null;
      })}
    </>
  );
}
