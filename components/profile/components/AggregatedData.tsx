import { Box, CircularProgress, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { DeepDaoOrganization } from 'lib/deepdao/client';
import useSWRImmutable from 'swr/immutable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import { UserDetailsProps } from './UserDetails';

export function AggregatedDataItem ({ value, label }: { value: number, label: string }) {

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

function showDateWithMonthAndYear (dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `${date.toLocaleString('default', {
    month: 'long'
  })} ${date.getFullYear()}`;
}

function DeepDaoOrganization ({ organization, earliestEventDate, latestEventDate }:
  { organization: DeepDaoOrganization, earliestEventDate: string, latestEventDate: string }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <Stack key={organization.organizationId}>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Typography variant='h5'>{organization.name}</Typography>
        <IconButton
          size='small'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
        </IconButton>
      </Stack>
      <Typography variant='subtitle1'>{showDateWithMonthAndYear(earliestEventDate) ?? '?'} - {showDateWithMonthAndYear(latestEventDate) ?? '?'}</Typography>

    </Stack>
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
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const organizationsRecord: Record<string, DeepDaoOrganization> = data.organizations
    .reduce((acc, org) => ({ ...acc, [org.organizationId]: org }), {});

  // Sort the proposals and votes based on their created at date and attach organization data with it
  const events = [...data.proposals, ...data.votes]
    .sort((eventA, eventB) => eventA.createdAt > eventB.createdAt ? -1 : 1)
    .map(event => ({ ...event, organization: organizationsRecord[event.organizationId] }));

  const organizationIdSet: Set<string> = new Set();
  const sortedOrganizationIds: string[] = [];
  const organizationEventDates: Record<string, {
    oldest: string
    latest: string
  }> = {};

  events.forEach(event => {
    if (!organizationIdSet.has(event.organizationId)) {
      sortedOrganizationIds.push(event.organizationId);
      organizationIdSet.add(event.organizationId);
    }

    if (!organizationEventDates[event.organizationId]) {
      organizationEventDates[event.organizationId] = {
        oldest: event.createdAt,
        latest: event.createdAt
      };
    }
    else if (organizationEventDates[event.organizationId].latest < event.createdAt) {
      organizationEventDates[event.organizationId].latest = event.createdAt;
    }
    else if (organizationEventDates[event.organizationId].oldest > event.createdAt) {
      organizationEventDates[event.organizationId].oldest = event.createdAt;
    }
  });

  const sortedOrganizations = sortedOrganizationIds.map(organizationId => organizationsRecord[organizationId]);

  return (
    <Grid container display='flex' gap={2} flexDirection='column'>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='communities' value={data.daos} />
        <AggregatedDataItem label='votes' value={data.totalVotes} />
      </Box>
      <Box display='flex' gap={2} mr={2}>
        <AggregatedDataItem label='proposals' value={data.totalProposals} />
        <AggregatedDataItem label={data.bounties > 1 ? 'bounties' : 'bounty'} value={data.bounties} />
      </Box>

      <Stack gap={2}>
        {sortedOrganizations.map(organization => (
          <DeepDaoOrganization
            organization={organization}
            key={organization.organizationId}
            latestEventDate={organizationEventDates[organization.organizationId]?.latest}
            earliestEventDate={organizationEventDates[organization.organizationId]?.oldest}
          />
        ))}
      </Stack>
    </Grid>
  );
}
