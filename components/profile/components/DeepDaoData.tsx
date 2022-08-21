import { Box, Chip, CircularProgress, Divider, Grid, Link, Paper, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';
import useSWRImmutable from 'swr/immutable';

import styled from '@emotion/styled';
import { GetPoapsResponse } from 'lib/poap';
import { isTruthy } from 'lib/utilities/types';
import { ExtendedPoap } from 'models';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import DeepDaoOrganizationRow, { OrganizationDetails } from './DeepDaoOrganizationRow';
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

const StyledImage = styled.img`
  width: 100%;
  border-radius: 50%;
`;

function PoapRow ({ poap }: {poap: ExtendedPoap}) {

  return (
    <Stack
      sx={{
        flexDirection: {
          sm: 'row',
          xs: 'column'
        }
      }}
      gap={2}
    >
      <Box
        width={{
          sm: 75,
          xs: 100
        }}
      >
        <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
          <StyledImage src={poap.imageURL} />
        </Link>
      </Box>
      <Stack>
        <Typography fontWeight={500} variant='h6'>{poap.name}</Typography>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(poap.created) ?? '?'}</Typography>
      </Stack>
    </Stack>
  );
}

export function DeepDaoData ({ user, poapData }: Pick<UserDetailsProps, 'user'> & {poapData: GetPoapsResponse | undefined}) {

  const poaps: ExtendedPoap[] = [];

  poapData?.hiddenPoaps.forEach(poap => poaps.push(poap as any));
  poapData?.visiblePoaps.forEach(poap => poaps.push(poap as any));

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

  const organizationsRecord: Record<
    string,
    OrganizationDetails | undefined
  > = data.organizations
    .reduce((acc, org) => ({
      ...acc,
      [org.organizationId]: {
        ...org,
        oldestEventDate: '',
        latestEventDate: '',
        proposals: [],
        votes: []
      }
    }), {});

  // Sort the proposals and votes based on their created at date and attach organization data with it
  const events = [...data.proposals.map(proposal => ({ type: 'proposal', ...proposal })), ...data.votes.map(vote => ({ type: 'vote', ...vote }))];

  events.forEach(event => {
    const organization = organizationsRecord[event.organizationId];
    if (organization) {
      if (event.type === 'proposal') {
        organization.proposals.push(event as DeepDaoProposal);
      }
      else if (event.type === 'vote') {
        organization.votes.push(event as DeepDaoVote);
      }
      if (!organization.oldestEventDate) {
        organization.oldestEventDate = event.createdAt;
      }
      else if (organization.oldestEventDate > event.createdAt) {
        organization.oldestEventDate = event.createdAt;
      }

      if (!organization.latestEventDate) {
        organization.latestEventDate = event.createdAt;
      }
      else if (organization.latestEventDate < event.createdAt) {
        organization.latestEventDate = event.createdAt;
      }
    }
  });

  const sortedOrganizations = Object.values(organizationsRecord).filter(isTruthy)
    .sort((orgA, orgB) => orgA.latestEventDate > orgB.latestEventDate ? -1 : 1)
    .filter((organization) => (organization.votes.length !== 0 || organization.proposals.length !== 0));

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

      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
        <Typography
          sx={{
            typography: {
              sm: 'h4',
              xs: 'h5'
            }
          }}
          fontWeight={500}
        >Organizations
        </Typography>
        <Chip size='small' label={sortedOrganizations.length} />
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

      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
        <Typography
          fontWeight={500}
          sx={{
            typography: {
              sm: 'h4',
              xs: 'h5'
            }
          }}
        >Poap/NFTs
        </Typography>
        <Chip size='small' label={poaps.length} />
      </Stack>
      <Stack gap={2}>
        {poaps.map(poap => (
          <Box
            key={poap.id}
          >
            <PoapRow
              poap={poap}
            />
            <Divider sx={{
              mt: 2
            }}
            />
          </Box>
        ))}
      </Stack>
    </Grid>
  );
}
