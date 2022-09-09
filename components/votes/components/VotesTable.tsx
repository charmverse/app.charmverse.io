import { Box, Grid, Tooltip, Typography } from '@mui/material';
import { VoteContext, VoteStatus } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import VoteDetail from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import GridContainer from 'components/common/Grid/GridContainer';
import GridHeader from 'components/common/Grid/GridHeader';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import useTasks from 'components/nexus/hooks/useTasks';
import { usePages } from 'hooks/usePages';
import { humanFriendlyDate, toMonthDate } from 'lib/utilities/dates';
import { ExtendedVote } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import NoVotesMessage from './NoVotesMessage';
import VoteActionsMenu from './VoteActionsMenu';
import VoteIcon from './VoteIcon';
import VoteStatusChip from './VoteStatusChip';

export interface VoteRow {
  id: string;
  pageId: string;
  title: string;
  createdAt: Date;
  createdBy: string;
  deadline: any | null;
  status: VoteStatus | 'Draft';
  context: VoteContext;
}

export default function VotesTable ({ votes, mutateVotes }: { votes?: (ExtendedVote | VoteRow)[], mutateVotes: () => void }) {
  const router = useRouter();
  const { pages } = usePages();
  const { mutate: mutateTasks } = useTasks();
  const { showPage } = usePageDialog();
  const [activeVote, setActiveVote] = useState<ExtendedVote | null>(null);

  const openPage = useCallback((pageId: string) => {
    showPage({
      pageId,
      onClose: refreshVotesAndTasks
    });
  }, [pages]);

  useEffect(() => {
    if (activeVote && votes) {
      setActiveVote(votes.find(vote => vote.id === activeVote.id) as ExtendedVote);
    }
  }, [votes, activeVote]);

  async function deleteVote (voteId: string) {
    await charmClient.votes.deleteVote(voteId);
    refreshVotesAndTasks();
  }

  async function cancelVote (voteId: string) {
    await charmClient.votes.cancelVote(voteId);
    refreshVotesAndTasks();
  }

  function refreshVotesAndTasks () {
    mutateTasks();
    mutateVotes();
  }

  async function castVote (voteId: string, choice: string) {
    const userVote = await charmClient.votes.castVote(voteId, choice);
    mutateVotes();
    return userVote;
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
            {vote.context === 'proposal' ? (
              <Box display='flex' alignItems='center' justifyContent='space-between' onClick={() => openPage(vote.pageId)}>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}><VoteIcon {...vote} /></Box>
                  <div>
                    <Typography><strong>{pages[vote.pageId]?.title || 'Untitled'}</strong></Typography>
                  </div>
                </Box>
                <Button className='show-on-hover' color='secondary' variant='outlined' size='small'>Open</Button>
              </Box>
            ) : (
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}><VoteIcon {...vote} /></Box>
                  <div>
                    <Link color='textPrimary' href={getVoteUrl({ domain: router.query.domain as string, path: pages[vote.pageId]?.path || '', voteId: vote.id })}>
                      <Typography><strong>{vote.title}</strong></Typography>
                      <Typography variant='caption'>{pages[vote.pageId]?.title || 'Untitled'}</Typography>
                    </Link>
                  </div>
                </Box>
                <Button
                  className='show-on-hover'
                  onClick={() => {
                    setActiveVote(vote as ExtendedVote);
                  }}
                  color='secondary'
                  variant='outlined'
                  size='small'
                >Open
                </Button>
              </Box>
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
              vote={vote}
            />
          </Grid>
        </GridContainer>
      ))}
      <Modal
        title='Vote details'
        size='large'
        open={!!activeVote}
        onClose={() => {
          setActiveVote(null);
        }}
      >
        <VoteDetail
          detailed
          vote={activeVote!}
          cancelVote={cancelVote}
          deleteVote={deleteVote}
          castVote={castVote}
        />
      </Modal>
    </>
  );
}

function getVoteUrl ({ domain, path, voteId }: { domain: string, path: string, voteId: string }) {
  return `/${domain}/${path}?voteId=${voteId}`;
}
