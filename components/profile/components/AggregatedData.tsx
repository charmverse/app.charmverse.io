import { Box, Chip, CircularProgress, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { sortDeepdaoOrgs } from 'lib/deepdao/sortDeepdaoOrgs';
import useSWRImmutable from 'swr/immutable';
import DeepDaoOrganizationRow, { OrganizationDetails } from './DeepDaoOrganizationRow';
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

  const visibleDaos: OrganizationDetails[] = [];
  const hiddenDaos: OrganizationDetails[] = [];
  sortedOrganizations.forEach(dao => {
    if (dao.isHidden) {
      hiddenDaos.push(dao);
    }
    else {
      visibleDaos.push(dao);
    }
  });

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

      {visibleDaos.length !== 0 ? (
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
            <Chip label={visibleDaos.length} />
          </Stack>
          <Stack gap={2}>
            {visibleDaos.map(organization => (
              <Box
                key={organization.organizationId}
              >
                <DeepDaoOrganizationRow
                  onClick={() => {

                  }}
                  visible={false}
                  showVisibilityIcon={!isPublic}
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
