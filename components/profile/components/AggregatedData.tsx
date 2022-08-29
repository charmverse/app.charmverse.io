import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { isPublicUser, UserDetailsProps } from './UserDetails';

export function AggregatedDataItem ({ value, label }: { value: number, label: string }) {
  return (
    <Paper
      sx={{
        gap: 1,
        px: 2,
        py: 1,
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        textAlign: {
          sm: 'left',
          xs: 'center'
        }
      }}
    >
      <Typography
        color='secondary'
        sx={{
          fontWeight: 500
        }}
      > {label}
      </Typography>
      <Typography sx={{
        fontSize: {
          xs: '1.5rem',
          sm: '1.75rem'
        },
        fontWeight: 'bold'
      }}
      >
        {value}
      </Typography>

    </Paper>
  );
}

export default function AggregatedData ({ user }: Pick<UserDetailsProps, 'user'>) {
  const isPublic = isPublicUser(user);

  const { data, isValidating, mutate } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });

  if (isValidating) {
    return (
      <Box display='flex' alignItems='center' gap={1}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Grid container display='flex' gap={2} flexDirection='column'>
      <Box
        gap={1}
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row'
          }
        }}
      >
        <AggregatedDataItem label='Communities' value={data.organizations.length} />
        <AggregatedDataItem label='Proposals' value={data.totalProposals} />
        <AggregatedDataItem label='Votes' value={data.totalVotes} />
        <AggregatedDataItem label='Bounties' value={data.bounties} />
      </Box>
    </Grid>
  );
}
