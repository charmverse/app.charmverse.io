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
import { GetPoapsResponse } from 'lib/poap';
import { ExtendedPoap } from 'models';
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

  proposals = proposals.sort((proposalA, proposalB) => proposalA.createdAt > proposalB.createdAt ? -1 : 1);
  votes = votes.sort((voteA, voteB) => voteA.createdAt > voteB.createdAt ? -1 : 1);

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

type OrganizationDetails = DeepDaoOrganization & {
  proposals: DeepDaoProposal[],
  votes: DeepDaoVote[],
  oldestEventDate: string,
  latestEventDate: string
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

  const poaps: (Partial<ExtendedPoap> & {createdAt: string})[] = [];

  const hiddenPoapIds: Set<string> = new Set();
  const visiblePoapIds: Set<string> = new Set();

  poapData?.hiddenPoaps.forEach(poap => {
    poaps.push({ ...poap, createdAt: poap.created as string });
    hiddenPoapIds.add(poap.id as string);
  });
  poapData?.visiblePoaps.forEach(poap => {
    poaps.push({ ...poap, createdAt: poap.created as string });
    visiblePoapIds.add(poap.id as string);
  });

  const organizationsRecord: Record<string, OrganizationDetails> = data.organizations
    .reduce((acc, org) => ({ ...acc,
      [org.organizationId]: {
        ...org,
        proposals: [],
        votes: [],
        oldestEventDate: '',
        latestEventDate: ''
      } }), {});

  // Sort the proposals and votes based on their created at date and attach organization data with it
  const events = [...data.proposals.map(proposal => ({ type: 'proposal', ...proposal })), ...data.votes.map(vote => ({ type: 'vote', ...vote }))];

  events.forEach(event => {
    if (event.type === 'proposal') {
      organizationsRecord[event.organizationId].proposals.push(event as DeepDaoProposal);
    }
    else if (event.type === 'vote') {
      organizationsRecord[event.organizationId].votes.push(event as DeepDaoVote);
    }
    if (!organizationsRecord[event.organizationId].oldestEventDate) {
      organizationsRecord[event.organizationId].oldestEventDate = event.createdAt;
    }
    else if (organizationsRecord[event.organizationId].oldestEventDate > event.createdAt) {
      organizationsRecord[event.organizationId].oldestEventDate = event.createdAt;
    }

    if (!organizationsRecord[event.organizationId].latestEventDate) {
      organizationsRecord[event.organizationId].latestEventDate = event.createdAt;
    }
    else if (organizationsRecord[event.organizationId].latestEventDate < event.createdAt) {
      organizationsRecord[event.organizationId].latestEventDate = event.createdAt;
    }
  });

  const sortedItems = ([...Object.values(organizationsRecord).map(org => ({ ...org, type: 'organization' as const })), ...poaps.map(poap => ({ ...poap, type: 'poap' } as any))] as ((OrganizationDetails & {type: 'organization'}) | ({type: 'poap'} & ExtendedPoap))[]).sort((itemA, itemB) => {
    if (itemA.type === 'organization' && itemB.type === 'poap') {
      return itemA.oldestEventDate > itemB.created ? -1 : 1;
    }
    else if (itemA.type === 'organization' && itemB.type === 'organization') {
      return itemA.oldestEventDate > itemB.oldestEventDate ? -1 : 1;
    }
    else if (itemA.type === 'poap' && itemB.type === 'organization') {
      return itemA.created > itemB.oldestEventDate ? -1 : 1;
    }
    else if (itemA.type === 'poap' && itemB.type === 'poap') {
      return itemA.created > itemB.created ? -1 : 1;
    }
    return 0;
  });

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
        {sortedItems.map(item => (
          <Box
            key={item.type === 'poap' ? item.id : item.organizationId}
          >
            {item.type === 'organization' && (organizationsRecord[item.organizationId].proposals.length !== 0 || organizationsRecord[item.organizationId].votes.length !== 0) ? (
              <>
                <DeepDaoOrganizationRow
                  votes={organizationsRecord[item.organizationId].votes}
                  proposals={organizationsRecord[item.organizationId].proposals}
                  organization={item}
                  latestEventDate={organizationsRecord[item.organizationId]?.latestEventDate}
                  earliestEventDate={organizationsRecord[item.organizationId]?.oldestEventDate}
                />
                <Divider sx={{
                  mt: 2
                }}
                />
              </>
            ) : null}
          </Box>
        ))}
      </Stack>
    </Grid>
  );
}
