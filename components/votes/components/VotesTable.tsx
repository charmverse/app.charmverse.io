import { Page, VoteStatus } from '@prisma/client';
import { useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { Tooltip, Typography, Box, Grid } from '@mui/material';
import Link from 'components/common/Link';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import GridHeader from 'components/common/Grid/GridHeader';
import GridContainer from 'components/common/Grid/GridContainer';
import LoadingComponent from 'components/common/LoadingComponent';
import Button from 'components/common/Button';
import useTasks from 'components/nexus/hooks/useTasks';
import { humanFriendlyDate, toMonthDate } from 'lib/utilities/dates';
import { usePages } from 'hooks/usePages';
import charmClient from 'charmClient';
import NoVotesMessage from './NoVotesMessage';
import VoteStatusChip from './VoteStatusChip';
import ProposalDialog from './Proposal/ProposalDialog';
import VoteActionsMenu from './VoteActionsMenu';

export interface VoteRow {
  id: string;
  pageId: string;
  title: string;
  createdAt: Date;
  createdBy: string;
  deadline: any | null;
  status: VoteStatus | 'Draft';
}

export default function VotesTable ({ votes, mutateVotes }: { votes?: VoteRow[], mutateVotes: () => void }) {

  const router = useRouter();
  const { pages, setPages } = usePages();
  const { mutate: mutateTasks } = useTasks();

  const [activePage, setActivePage] = useState<Page | null>();

  const openPage = useCallback((pageId: string) => {
    const page = pages[pageId];
    if (page) {
      setActivePage(page);
    }
  }, [pages]);

  function closePage () {
    setActivePage(null);
  }

  async function deleteVote (voteId: string) {
    // delete the related page instead of deleting the vote
    const vote = votes?.find(v => v.id === voteId);
    if (vote?.pageId) {
      const page = pages[vote.pageId];
      if (page) {
        await charmClient.archivePage(page.id);
        setPages((_pages) => {
          _pages[page.id] = { ...page, deletedAt: new Date() };
          return { ..._pages };
        });
      }
    }
    else {
      await charmClient.deleteVote(voteId);
    }
    mutateTasks();
    mutateVotes();
  }

  async function cancelVote (voteId: string) {
    await charmClient.cancelVote(voteId);
    mutateTasks();
    mutateVotes();
  }

  function editProposal (voteId: string) {
    const vote = votes?.find(v => v.id === voteId);
    if (vote) {
      openPage(vote.pageId);
    }
  }

  return (
    <>
      <GridHeader>
        <Grid item xs={8} md={5}>
          Title
        </Grid>
        <Grid item xs={3} md={2} display='flex' justifyContent='center'>
          Status
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Deadline
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Created
        </Grid>
        <Grid item xs={1} />
      </GridHeader>
      {!votes && (
        <LoadingComponent height='250px' isLoading={true} />
      )}
      {votes?.length === 0 && (
        <Box height='250px' mt={2}>
          <NoVotesMessage message='There are no votes yet. Create a vote from a page to get started!' />
        </Box>
      )}
      {votes?.map(vote => (
        <GridContainer key={vote.id}>
          <Grid item xs={8} sm={8} md={5} sx={{ cursor: 'pointer' }}>
            {pages[vote.pageId]?.type === 'proposal' && (
              <Box display='flex' alignItems='center' justifyContent='space-between' onClick={() => openPage(vote.pageId)}>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}><VoteIcon color='secondary' /></Box>
                  <div>
                    <Typography><strong>{vote.title}</strong></Typography>
                  </div>
                </Box>
                <Button className='show-on-hover' color='secondary' variant='outlined' size='small'>Open</Button>
              </Box>
            )}
            {pages[vote.pageId]?.type !== 'proposal' && (
              <Link color='textPrimary' href={getVoteUrl({ domain: router.query.domain as string, path: pages[vote.pageId]?.path || '', voteId: vote.id })}>
                <Box display='flex' alignItems='center' justifyContent='space-between'>
                  <Box display='flex' alignItems='flex-start' gap={1}>
                    <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}><VoteIcon color='secondary' /></Box>
                    <div>
                      <Typography><strong>{vote.title}</strong></Typography>
                      <Typography variant='caption'>{pages[vote.pageId]?.title || 'Untitled'}</Typography>
                    </div>
                  </Box>
                  <Button className='show-on-hover' color='secondary' variant='outlined' size='small'>Open</Button>
                </Box>
              </Link>
            )}
          </Grid>
          <Grid item xs={3} md={2} display='flex' justifyContent='center'>
            <VoteStatusChip status={vote.status} />
          </Grid>
          <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
            <Tooltip arrow placement='top' title={vote.deadline ? humanFriendlyDate(vote.deadline, { withTime: true }) : ''}>
              <Typography color={vote.deadline ? 'inherit' : 'secondary'}>{vote.deadline ? DateTime.fromISO(vote.deadline).toRelative({ base: DateTime.now() }) : 'N/A'}</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} display='flex' justifyContent='center'>
            <Tooltip arrow placement='top' title={`Created on ${humanFriendlyDate(vote.createdAt, { withTime: true })}`}>
              <span>{toMonthDate(vote.createdAt)}</span>
            </Tooltip>
          </Grid>
          <Grid item xs={1} display='flex' justifyContent='flex-end'>
            <VoteActionsMenu
              deleteVote={deleteVote}
              cancelVote={cancelVote}
              editProposal={pages[vote.pageId]?.type === 'proposal' ? editProposal : undefined}
              vote={vote}
            />
          </Grid>
        </GridContainer>
      ))}
      <ProposalDialog page={activePage} onClose={closePage} />
    </>
  );
}

function getVoteUrl ({ domain, path, voteId }: { domain: string, path: string, voteId: string }) {
  return `/${domain}/${path}?voteId=${voteId}`;
}
