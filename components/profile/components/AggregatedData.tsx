import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { UserDetailsProps } from './UserDetails/UserDetails';

export function AggregatedDataItem ({ value, label }: {value: number, label: string}) {

  return (
    <Grid item xs={6}>
      <Paper
        sx={{
          gap: 1,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography sx={{
          fontSize: {
            xs: '1.25rem',
            sm: '1.5rem'
          },
          fontWeight: 'bold'
        }}
        >
          {value}
        </Typography>
        <Typography
          color='secondary'
          sx={{
            fontWeight: 500
          }}
        > {label}
        </Typography>
      </Paper>

    </Grid>
  );
}

export function AggregatedData ({ user }: Pick<UserDetailsProps, 'user'>) {
  const { data, isValidating } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });

  if (isValidating) {
    return (
      <Box display='flex' alignItems='center' gap={1}>
        <CircularProgress size={24} />
        <Typography variant='subtitle1' color='secondary'>Fetching data</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Grid container display='flex' gap={2} flexDirection='column'>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='communities' value={data.daos} />
        <AggregatedDataItem label='votes' value={data.votes} />
      </Box>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='proposals' value={data.proposals} />
        <AggregatedDataItem label={data.bounties > 1 ? 'bounties' : 'bounty'} value={data.bounties} />
      </Box>
    </Grid>
  );
}
