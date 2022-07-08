import { Page, VoteStatus } from '@prisma/client';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { Tooltip, Typography, Box, Grid } from '@mui/material';
import Link from 'components/common/Link';
import VoteIcon from '@mui/icons-material/HowToVoteOutlined';
import GridHeader from 'components/common/Grid/GridHeader';
import GridContainer from 'components/common/Grid/GridContainer';
import LoadingComponent from 'components/common/LoadingComponent';
import Button from 'components/common/Button';
import { humanFriendlyDate, toMonthDate } from 'lib/utilities/dates';
import { usePages } from 'hooks/usePages';
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

export default function VotesTable ({ votes }: { votes?: VoteRow[] }) {

  const router = useRouter();
  const { pages } = usePages();

  const [activePage, setActivePage] = useState<Page | null>();

  function openPage (pageId: string) {
    const page = pages[pageId];
    if (page) {
      setActivePage(page);
    }
  }

  function closePage () {
    setActivePage(null);
  }

  return (
    <>
      <GridHeader>
        <Grid item xs={8} md={6}>
          Title
        </Grid>
        <Grid item xs={4} md={2} display='flex' justifyContent='center'>
          Status
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Deadline
        </Grid>
        <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
          Created
        </Grid>
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
          <Grid item xs={8} sm={8} md={5}>
            {pages[vote.pageId]?.type === 'proposal' && (
              <Box display='flex' alignItems='center' justifyContent='space-between' onClick={() => openPage(vote.pageId)}>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <VoteIcon color='secondary' />
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
                    <VoteIcon color='secondary' />
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
            <Tooltip arrow placement='top' title={humanFriendlyDate(vote.deadline, { withTime: true })}>
              <Typography>{vote.deadline ? DateTime.fromISO(vote.deadline).toRelative({ base: DateTime.now() }) : 'N/A'}</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} display='flex' justifyContent='center'>
            {toMonthDate(vote.createdAt)}
          </Grid>
          <Grid item xs={1}>
            <VoteActionsMenu vote={vote} />
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
