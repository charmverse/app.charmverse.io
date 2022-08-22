import { Box, Chip, CircularProgress, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { sortDeepdaoOrgs } from 'lib/deepdao/sortDeepdaoOrgs';
import useSWRImmutable from 'swr/immutable';
import DeepDaoOrganizationRow from './DeepDaoOrganizationRow';
import { UserDetailsProps } from './UserDetails';

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

export function DeepDaoData ({ user }: Pick<UserDetailsProps, 'user'>) {

  const { data, isValidating } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
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

  const sortedOrganizations = sortDeepdaoOrgs(data);

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
        <AggregatedDataItem label='Communities' value={data.daos} />
        <AggregatedDataItem label='Proposals' value={data.totalProposals} />
        <AggregatedDataItem label='Votes' value={data.totalVotes} />
        <AggregatedDataItem label='Bounties' value={data.bounties} />
      </Box>

      {sortedOrganizations.length !== 0 ? (
        <>
          <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
            <Typography
              sx={{
                typography: {
                  sm: 'h1',
                  xs: 'h2'
                }
              }}
            >Organizations
            </Typography>
            <Chip label={sortedOrganizations.length} />
          </Stack>
          <Stack gap={2}>
            {sortedOrganizations.map(organization => (
              <Box
                key={organization.organizationId}
              >
                <DeepDaoOrganizationRow
                  organization={organization}
                />
                <Divider sx={{
                  mt: 2
                }}
                />
              </Box>
            ))}
          </Stack>
        </>
      ) : null}
    </Grid>
  );
}
