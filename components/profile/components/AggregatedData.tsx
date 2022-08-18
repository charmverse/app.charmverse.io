import { Box, CircularProgress, Collapse, Divider, Grid, IconButton, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { useTheme } from '@emotion/react';
import { DeepDaoOrganization, DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/client';
import useSWRImmutable from 'swr/immutable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import { useState } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
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

function showDateWithMonthAndYear (dateInput: Date | string, showDate?: boolean) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `${date.toLocaleString('default', {
    month: 'long'
  })}${showDate ? ` ${date.getDate()},` : ''} ${date.getFullYear()}`;
}

interface DeepDaoOrganizationRowProps {
  organization: DeepDaoOrganization
  earliestEventDate: string
  latestEventDate: string
  proposals: DeepDaoProposal[]
  votes: DeepDaoVote[]
}

const TASK_TABS = [
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <ForumIcon />, label: 'Proposals', type: 'proposal' }
] as const;

function DeepDaoOrganizationRow ({ votes, proposals, organization, earliestEventDate, latestEventDate }: DeepDaoOrganizationRowProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentTask, setCurrentTask] = useState<'vote' | 'proposal'>('vote');
  const theme = useTheme();

  return (
    <Stack key={organization.organizationId} gap={1}>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Typography fontWeight={500} variant='h5'>{organization.name}</Typography>
        <IconButton
          size='small'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
        </IconButton>
      </Stack>
      <Typography>{showDateWithMonthAndYear(earliestEventDate) ?? '?'} - {showDateWithMonthAndYear(latestEventDate) ?? '?'}</Typography>

      <Collapse in={!isCollapsed}>
        <Box>
          <Tabs
            sx={{
              mb: 2
            }}
            indicatorColor='primary'
            value={TASK_TABS.findIndex(taskTab => taskTab.type === currentTask)}
          >
            {TASK_TABS.map(task => (
              <Tab
                component='div'
                disableRipple
                iconPosition='start'
                icon={task.icon}
                key={task.label}
                sx={{
                  px: 1.5,
                  fontSize: 14,
                  minHeight: 0,
                  '&.MuiTab-root': {
                    color: theme.palette.secondary.main
                  }
                }}
                label={task.label}
                onClick={() => {
                  setCurrentTask(task.type);
                }}
              />
            ))}
          </Tabs>
          {(currentTask === 'vote' ? (
            <Stack gap={2}>
              {votes.map((vote, voteNumber) => (
                <Stack key={vote.voteId} flexDirection='row' justifyContent='space-between'>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    {vote.successful ? <ThumbUpIcon color='success' fontSize='small' /> : <ThumbDownIcon color='error' fontSize='small' />}
                    <Typography fontWeight={500}>{voteNumber + 1}.</Typography>
                    <Typography>{vote.title}</Typography>
                  </Stack>
                  <Typography variant='subtitle1'>{showDateWithMonthAndYear(vote.createdAt, true)}</Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack gap={2}>
              {proposals.map((proposal, proposalNumber) => (
                <Stack key={proposal.proposalId} flexDirection='row' justifyContent='space-between'>
                  <Stack flexDirection='row' gap={1} alignItems='center'>
                    {proposal.outcome === proposal.voteChoice ? <ThumbUpIcon color='success' fontSize='small' /> : <ThumbDownIcon color='error' fontSize='small' />}
                    <Typography fontWeight={500}>{proposalNumber + 1}.</Typography>
                    <Typography>{proposal.title}</Typography>
                  </Stack>
                  <Typography variant='subtitle1'>{showDateWithMonthAndYear(proposal.createdAt, true)}</Typography>
                </Stack>
              ))}
            </Stack>
          ))}
        </Box>
      </Collapse>
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

  const organizationsRecord: Record<string, DeepDaoOrganization & {proposals: DeepDaoProposal[], votes: DeepDaoVote[]}> = data.organizations
    .reduce((acc, org) => ({ ...acc,
      [org.organizationId]: {
        ...org,
        proposals: [],
        votes: []
      } }), {});

  data.proposals.forEach(proposal => {
    organizationsRecord[proposal.organizationId].proposals.push(proposal);
  });

  data.votes.forEach(vote => {
    organizationsRecord[vote.organizationId].votes.push(vote);
  });

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
          <Box
            key={organization.organizationId}
          >
            <DeepDaoOrganizationRow
              votes={organizationsRecord[organization.organizationId].votes}
              proposals={organizationsRecord[organization.organizationId].proposals}
              organization={organization}
              latestEventDate={organizationEventDates[organization.organizationId]?.latest}
              earliestEventDate={organizationEventDates[organization.organizationId]?.oldest}
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
