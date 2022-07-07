import HowToVote from '@mui/icons-material/HowToVote';
import { Alert, Box, Card, Grid, Typography } from '@mui/material';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { GetTasksResponse } from 'pages/api/tasks/list';
import { KeyedMutator } from 'swr';

interface VoteTasksListProps {
  tasks: GetTasksResponse | undefined
  error: any
  mutateTasks: KeyedMutator<GetTasksResponse>
}

export function VoteTasksListRow (
  {
    page: { path: pagePath, title: pageTitle },
    space: { domain: spaceDomain, name: spaceName },
    deadline, title: voteTitle, id: voteId
  }: VoteTask
) {

  const voteLink = `/${spaceDomain}/${pagePath}?voteId=${voteId}`;
  const voteLocation = `${pageTitle || 'Untitled'} in ${spaceName}`;

  return (
    <Box>
      <Card sx={{ width: '100%', px: 2, py: 1, my: 2, borderLeft: 0, borderRight: 0 }} variant='outlined'>
        <Grid justifyContent='space-between' alignItems='center' gap={1} container>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              mr: 1,
              alignItems: 'center',
              display: 'flex',
              gap: 0.5
            }}
            fontSize={{ sm: 16, xs: 18 }}
          >
            {voteTitle}
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={4}
            sx={{
              fontSize: { xs: 14, sm: 'inherit' }
            }}
          >
            {voteLocation}
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={2}
            sx={{
              fontSize: { xs: 14, sm: 'inherit' }
            }}
          >
            due {DateTime.fromJSDate(new Date(deadline)).toRelative({ base: DateTime.now() })}
          </Grid>
          <Grid
            item
            xs={12}
            sm={2}
            md={1}
          >
            <Button href={voteLink}>Vote now</Button>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}

export function VoteTasksList ({ error, tasks }: VoteTasksListProps) {

  if (error) {
    return (
      <Box>
        <Alert severity='error'>
          There was an error. Please try again later!
        </Alert>
      </Box>
    );
  }
  else if (!tasks?.votes) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalVotes = tasks?.votes.length ?? 0;

  if (totalVotes === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <HowToVote />
          <Typography color='secondary'>You don't have any votes right now</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      {tasks.votes.map(vote => <VoteTasksListRow key={vote.id} {...vote} />)}
    </>
  );
}
