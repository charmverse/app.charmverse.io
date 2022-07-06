import { DateTime } from 'luxon';
import { Alert, Box, Card, Chip, Collapse, Divider, Grid, Typography } from '@mui/material';
import GridHeader from 'components/common/Grid/GridHeader';
import GridContainer from 'components/common/Grid/GridContainer';
import { humanFriendlyDate } from 'lib/utilities/dates';
import type { UIVote, ViewState } from '../VotesPage';

export default function VotesTable ({ votes }: { votes?: UIVote[] }) {
  if (votes?.[0]) {
    votes[0].title = ' wdfgdsfg fsdgfdsg fdsg fdsgfdsg fsgfg sfdgfdsgfd gfg';
  }
  return (
    <>
      <GridHeader>
        <Grid item xs={6}>
        </Grid>
        <Grid item xs={2}>
          Status
        </Grid>
        <Grid item xs={2}>
          Started
        </Grid>
        <Grid item xs={2}>
          Deadline
        </Grid>
      </GridHeader>
      {votes?.map(vote => (
        <GridContainer key={vote.id}>
          <Grid item xs={6}>
            {vote.title}
          </Grid>
          <Grid item xs={2}>
            {vote.status}
          </Grid>
          <Grid item xs={2}>
            {humanFriendlyDate(vote.createdAt)}
          </Grid>
          <Grid item xs={2}>
            {DateTime.fromISO(vote.deadline as any).toRelative({ base: DateTime.now() })}
          </Grid>
        </GridContainer>
      ))}
    </>
  );
}
