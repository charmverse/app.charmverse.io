import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { UserDetailsProps } from './UserDetails';

export function AggregatedDataItem ({ value, label }: {value: number, label: string}) {
  return (
    <Paper
      sx={{
        gap: 1,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1
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
        Fetching your data
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box display='flex' gap={2} flexDirection='column'>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='communities' value={data.daos} />
        <AggregatedDataItem label='votes' value={data.votes} />
      </Box>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='proposals' value={data.proposals} />
      </Box>
    </Box>
  );
}
