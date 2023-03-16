import { Box, Grid, Paper, Typography } from '@mui/material';

export function AggregatedDataItem({ value, label }: { value?: number; label: string }) {
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
      >
        {' '}
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: {
            xs: '1.5rem',
            sm: '1.75rem'
          },
          fontWeight: 'bold'
        }}
      >
        {value ?? <>&nbsp;</>}
      </Typography>
    </Paper>
  );
}

export default function AggregatedData({
  totalBounties,
  totalCommunities,
  totalProposals,
  totalVotes
}: {
  totalCommunities: number | undefined;
  totalProposals: number | undefined;
  totalVotes: number | undefined;
  totalBounties: number | undefined;
}) {
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
        <AggregatedDataItem label='Communities' value={totalCommunities} />
        <AggregatedDataItem label='Proposals' value={totalProposals} />
        <AggregatedDataItem label='Votes' value={totalVotes} />
        <AggregatedDataItem label='Bounties' value={totalBounties} />
      </Box>
    </Grid>
  );
}
