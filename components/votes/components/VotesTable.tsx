import { DateTime } from 'luxon';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, Typography } from '@mui/material';
import GridHeader from 'components/common/Grid/GridHeader';
import GridContainer from 'components/common/Grid/GridContainer';
import LoadingComponent from 'components/common/LoadingComponent';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { ExtendedVote } from 'lib/votes/interfaces';
import NoVotesMessage from './NoVotesMessage';
import VoteStatusChip from './VoteStatusChip';

export default function VotesTable ({ votes }: { votes?: ExtendedVote[] }) {
  return (
    <>
      <GridHeader>
        <Grid item xs={6}>
        </Grid>
        <Grid item xs={2}>
          Status
        </Grid>
        <Grid item xs={2}>
          Deadline
        </Grid>
        <Grid item xs={2}>
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
          <Grid item xs={6}>
            {vote.title}
          </Grid>
          <Grid item xs={2}>
            <VoteStatusChip status={vote.status} />
          </Grid>
          <Grid item xs={2}>
            {DateTime.fromISO(vote.deadline as any).toRelative({ base: DateTime.now() })}
          </Grid>
          <Grid item xs={2}>
            {humanFriendlyDate(vote.createdAt)}
          </Grid>
        </GridContainer>
      ))}
    </>
  );
}
