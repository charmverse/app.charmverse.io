import { Box, CircularProgress, Collapse, Divider, Grid, IconButton, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import charmClient from 'charmClient';
import { useTheme } from '@emotion/react';
import { DeepDaoOrganization, DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';
import useSWRImmutable from 'swr/immutable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import { useState } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { isTruthy } from 'lib/utilities/types';
import { ExtendedPoap } from 'models';
import { GetPoapsResponse } from 'lib/poap';
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

type OrganizationDetails = DeepDaoOrganization & {
  proposals: DeepDaoProposal[],
  votes: DeepDaoVote[],
  oldestEventDate: string,
  latestEventDate: string
}

interface DeepDaoOrganizationRowProps {
  organization: OrganizationDetails
}

const TASK_TABS = [
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <ForumIcon />, label: 'Proposals', type: 'proposal' }
] as const;

function PoapRow ({ poap }: {poap: ExtendedPoap}) {
  return (
    <Stack gap={1}>
      <Stack flexDirection='row' gap={2}>
        <Box>
          <img
            src={poap.imageURL}
            width={50}
            height='100%'
            style={{
              objectFit: 'contain'
            }}
          />
        </Box>
        <Stack justifyContent='space-between'>
          <Typography fontWeight={500} variant='h5'>{poap.name}</Typography>
          <Typography>{showDateWithMonthAndYear(poap.created) ?? '?'}</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

interface DeepDaoEvent {
  id: string
  title: string
  createdAt: string
  verdict: boolean
}

function DeepDaoOrganizationRow ({ organization }: DeepDaoOrganizationRowProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentTask, setCurrentTask] = useState<'vote' | 'proposal'>('vote');
  const theme = useTheme();

  const proposals: DeepDaoEvent[] = organization.proposals
    .sort((proposalA, proposalB) => proposalA.createdAt > proposalB.createdAt ? -1 : 1)
    .map(proposal => ({
      createdAt: proposal.createdAt,
      id: proposal.proposalId,
      title: proposal.title,
      verdict: proposal.outcome === proposal.voteChoice
    }));

  const votes: DeepDaoEvent[] = organization.votes
    .sort((voteA, voteB) => voteA.createdAt > voteB.createdAt ? -1 : 1)
    .map(vote => ({
      createdAt: vote.createdAt,
      id: vote.voteId,
      title: vote.title,
      verdict: Boolean(vote.successful)
    }));

  return (
    <Stack gap={1}>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Typography fontWeight={500} variant='h5'>{organization.name}</Typography>
        <IconButton
          size='small'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
        </IconButton>
      </Stack>
      <Typography variant='subtitle2'>{showDateWithMonthAndYear(organization.oldestEventDate) ?? '?'} - {showDateWithMonthAndYear(organization.latestEventDate) ?? '?'}</Typography>

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
          <Stack gap={2}>
            {
                (currentTask === 'vote' ? votes : proposals).map((event, eventNumber) => (
                  <Stack key={event.id} flexDirection='row' justifyContent='space-between'>
                    <Stack flexDirection='row' gap={1} alignItems='center'>
                      {event.verdict ? <ThumbUpIcon color='success' fontSize='small' /> : <ThumbDownIcon color='error' fontSize='small' />}
                      <Typography fontWeight={500}>{eventNumber + 1}.</Typography>
                      <Typography>{event.title}</Typography>
                    </Stack>
                    <Typography variant='subtitle1'>{showDateWithMonthAndYear(event.createdAt, true)}</Typography>
                  </Stack>
                ))
              }
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );

}

export function DeepDaoData ({ user, poapData }: Pick<UserDetailsProps, 'user'> & {poapData: GetPoapsResponse | undefined}) {
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
              organization={organization}
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
