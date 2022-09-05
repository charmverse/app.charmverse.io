import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Tooltip, Typography } from '@mui/material';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import GridContainer from 'components/common/Grid/GridContainer';
import GridHeader from 'components/common/Grid/GridHeader';
import LoadingComponent from 'components/common/LoadingComponent';
import PageDialog from 'components/common/Page/PageDialog';
import useTasks from 'components/nexus/hooks/useTasks';
import { usePages } from 'hooks/usePages';
import { IPageWithPermissions } from 'lib/pages';
import { ProposalWithUsers } from 'lib/proposal/interface';
import { humanFriendlyDate, toMonthDate } from 'lib/utilities/dates';
import { useCallback, useState } from 'react';
import { ProposalStatusChip } from '../../../components/[pageId]/DocumentPage/components/ProposalProperties/ProposalStatusBadge';
import NoProposalsMessage from './NoProposalsMessage';
import VoteActionsMenu from './ProposalActionsMenu';

export default function ProposalsTable ({ proposals, mutateProposals }: { proposals?: (ProposalWithUsers)[], mutateProposals: () => void }) {
  const { pages, setPages } = usePages();
  const { mutate: mutateTasks } = useTasks();
  const [activePage, setActivePage] = useState<IPageWithPermissions | null>(null);

  const openPage = useCallback((pageId: string) => {
    const page = pages[pageId];
    if (page) {
      setActivePage(page);
    }
  }, [pages]);

  function closePage () {
    setActivePage(null);
  }

  async function deleteProposal (proposalId: string) {
    const page = pages[proposalId];
    if (page) {
      await charmClient.archivePage(page.id);
      setPages((_pages) => {
        _pages[page.id] = { ...page, deletedAt: new Date() };
        return { ..._pages };
      });
      mutateTasks();
      mutateProposals();
    }
  }

  return (
    <>
      <GridHeader>
        <Grid item xs={8} md={7}>
          Title
        </Grid>
        <Grid item xs={3} md={2} display='flex' justifyContent='center'>
          Status
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Created
        </Grid>
        <Grid item xs={1} />
      </GridHeader>
      {!proposals && (
        <LoadingComponent height='250px' isLoading={true} />
      )}
      {proposals?.length === 0 && (
        <Box height='250px' mt={2}>
          <NoProposalsMessage message='There are no proposals yet. Create a proposal page to get started!' />
        </Box>
      )}
      {proposals?.map(proposal => {
        const proposalPage = pages[proposal.id];
        return proposalPage ? (
          <GridContainer key={proposal.id}>
            <Grid item xs={8} sm={8} md={5} sx={{ cursor: 'pointer' }}>
              <Box display='flex' alignItems='center' justifyContent='space-between' onClick={() => openPage(proposal.id)}>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}><TaskOutlinedIcon color='secondary' /></Box>
                  <div>
                    <Typography><strong>{pages[proposal.id]?.title || 'Untitled'}</strong></Typography>
                  </div>
                </Box>
                <Button className='show-on-hover' color='secondary' variant='outlined' size='small'>Open</Button>
              </Box>
            </Grid>
            <Grid item xs={3} md={2} display='flex' justifyContent='center'>
              <ProposalStatusChip status={proposal.status} />
            </Grid>
            <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} display='flex' justifyContent='center'>
              <Tooltip arrow placement='top' title={`Created on ${humanFriendlyDate(proposalPage.createdAt, { withTime: true })}`}>
                <span>{toMonthDate(proposalPage.createdAt)}</span>
              </Tooltip>
            </Grid>
            <Grid item xs={1} display='flex' justifyContent='flex-end'>
              <VoteActionsMenu
                deleteProposal={deleteProposal}
                editProposal={(proposalId) => openPage(proposalId)}
                proposal={proposal}
              />
            </Grid>
          </GridContainer>
        ) : null;
      })}
      {activePage && (
        <PageDialog
          page={activePage}
          onClose={() => {
            closePage();
            mutateTasks();
            mutateProposals();
          }}
        />
      )}
    </>
  );
}
