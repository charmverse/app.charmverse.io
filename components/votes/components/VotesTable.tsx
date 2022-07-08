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
import { ExtendedVote } from 'lib/votes/interfaces';
import NoVotesMessage from './NoVotesMessage';
import VoteStatusChip from './VoteStatusChip';

export default function VotesTable ({ votes }: { votes?: (ExtendedVote & { page: { path: string, title: string, type: string }})[] }) {

  const router = useRouter();

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
          <Grid item xs={8} sm={8} md={6}>
            <Link color='textPrimary' href={getVoteUrl({ domain: router.query.domain as string, path: vote.page.path, voteId: vote.id })}>
              <Box display='flex' alignItems='center' justifyContent='space-between'>
                <Box display='flex' alignItems='flex-start' gap={1}>
                  <VoteIcon color='secondary' />
                  <div>
                    <Typography><strong>{vote.page.type === 'proposal' ? vote.page.title : vote.title}</strong></Typography>
                    {vote.page.type !== 'proposal' && <Typography variant='caption'>{vote.page?.title}</Typography>}
                  </div>
                </Box>
                <Button className='show-on-hover' color='secondary' variant='outlined' size='small'>Open</Button>
              </Box>
            </Link>
          </Grid>
          <Grid item xs={4} md={2} display='flex' justifyContent='center'>
            <VoteStatusChip status={vote.status} />
          </Grid>
          <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} justifyContent='center'>
            <Tooltip arrow placement='top' title={humanFriendlyDate(vote.deadline, { withTime: true })}>
              <Typography>{DateTime.fromISO(vote.deadline as any).toRelative({ base: DateTime.now() })}</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={2} sx={{ display: { xs: 'none', md: 'flex' } }} display='flex' justifyContent='center'>
            {toMonthDate(vote.createdAt)}
          </Grid>
        </GridContainer>
      ))}
    </>
  );
}

function getVoteUrl ({ domain, path, voteId }: { domain: string, path: string, voteId: string }) {
  return `/${domain}/${path}?voteId=${voteId}`;
}
