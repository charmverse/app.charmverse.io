import { useTheme } from '@emotion/react';
import { Stack, Typography, IconButton, Collapse, Tabs, Tab } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ForumIcon from '@mui/icons-material/Forum';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { DeepDaoOrganization, DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';

const TASK_TABS = [
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <ForumIcon />, label: 'Proposals', type: 'proposal' }
] as const;

interface DeepDaoEvent {
  id: string
  title: string
  createdAt: string
  verdict: boolean
}

export type OrganizationDetails = DeepDaoOrganization & {
  proposals: DeepDaoProposal[],
  votes: DeepDaoVote[],
  oldestEventDate: string,
  latestEventDate: string
}

interface DeepDaoOrganizationRowProps {
  organization: OrganizationDetails
}

export default function DeepDaoOrganizationRow ({ organization }: DeepDaoOrganizationRowProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [currentTab, setCurrentTab] = useState<'vote' | 'proposal'>('vote');
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
    <Stack gap={0.5}>
      <Stack flexDirection='row' justifyContent='space-between'>
        <Typography
          sx={{
            fontSize: {
              sm: '1.15rem',
              xs: '1.05rem'
            }
          }}
          fontWeight={500}
        >{organization.name}
        </Typography>
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
            value={TASK_TABS.findIndex(taskTab => taskTab.type === currentTab)}
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
                  setCurrentTab(task.type);
                }}
              />
            ))}
          </Tabs>
          <Stack gap={2}>
            {
                (currentTab === 'vote' ? votes : proposals).map((event, eventNumber) => (
                  <Stack key={event.id} flexDirection='row' gap={1}>
                    <Stack
                      flexDirection='row'
                      gap={1}
                      alignItems='center'
                      sx={{
                        alignSelf: 'flex-start'
                      }}
                    >
                      {event.verdict ? (
                        <ThumbUpIcon
                          color='success'
                          fontSize='small'
                        />
                      ) : <ThumbDownIcon color='error' fontSize='small' />}
                      <Typography fontWeight={500}>{eventNumber + 1}.</Typography>
                    </Stack>
                    <Stack
                      gap={0.5}
                      sx={{
                        flexGrow: 1,
                        flexDirection: {
                          sm: 'column',
                          md: 'row'
                        },
                        alignItems: 'flex-start'
                      }}
                    >
                      <Typography sx={{
                        flexGrow: 1
                      }}
                      >{event.title}
                      </Typography>
                      <Typography variant='subtitle1' color='secondary' textAlign={{ sm: 'left', md: 'right' }} minWidth={100}>{showDateWithMonthAndYear(event.createdAt, true)}</Typography>
                    </Stack>
                  </Stack>
                ))
              }
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}
