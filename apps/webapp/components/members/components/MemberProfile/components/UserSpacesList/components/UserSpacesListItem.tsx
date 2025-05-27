import { styled } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CheckIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Collapse, IconButton, Stack, Tab, Tabs, Tooltip, Typography, Box } from '@mui/material';
import type {
  ProfileProposalEvent,
  ProfileVoteEvent,
  ProfileBountyEvent,
  CommunityDetails
} from '@packages/profile/interfaces';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import Avatar from 'components/common/Avatar';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { MemberProperties } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/MemberPropertiesWidget/MemberProperties';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { PropertyValueWithDetails } from '@packages/lib/members/interfaces';
import { isTouchScreen } from '@packages/lib/utils/browser';

const ProfileItemContainer = styled(({ visible, ...props }: any) => <Stack {...props} />)<{ visible: boolean }>`
  ${!isTouchScreen() && hoverIconsStyle()}

  .hidden-on-visible {
    opacity: ${({ visible }) => (visible ? 1 : 0.25)};
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding-bottom: ${({ theme }) => theme.spacing(2)};

  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }
`;

const TASK_TABS = [
  { icon: <HowToVoteIcon />, label: 'Votes', type: 'vote' },
  { icon: <TaskOutlinedIcon />, label: 'Proposals', type: 'proposal' },
  { icon: <BountyIcon />, label: 'Rewards', type: 'bounty' }
] as const;

type UserSpacesListItemProps = {
  space: CommunityDetails;
  showVisibilityIcon: boolean;
  visible: boolean;
  properties: PropertyValueWithDetails[];
  onClick: () => void;
};

export function UserSpacesListItem({
  space,
  properties,
  showVisibilityIcon,
  visible,
  onClick
}: UserSpacesListItemProps) {
  const hasVotes = space.votes.length > 0;
  const hasProposals = space.proposals.length > 0;
  const hasBounties = space.bounties.length > 0;
  const showTabs = hasVotes || hasProposals || hasBounties;
  const isCollapsible = hasVotes || hasProposals || hasBounties || properties.length > 0;
  const defaultTab = hasVotes ? 0 : hasProposals ? 1 : hasBounties ? 2 : null;
  const { formatDate } = useDateFormatter();

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (defaultTab !== null) {
      setCurrentTab(defaultTab);
    }
  }, [defaultTab]);

  function toggleCollapse() {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  }

  return (
    <ProfileItemContainer visible={visible}>
      <Box display='flex' gap={2} flexDirection='row' alignItems='center' onClick={toggleCollapse}>
        <Avatar className='hidden-on-visible' avatar={space.logo} name={space.name} variant='rounded' size='large' />
        <Box align-items='center' display='flex' justifyContent='space-between' flexGrow={1}>
          <Box className='hidden-on-visible'>
            <Box
              display='flex'
              flex='0 1 auto'
              alignItems='center'
              justifyContent='space-between'
              sx={{ wordBreak: 'break-word' }}
            >
              <Typography
                sx={{
                  fontSize: {
                    sm: '1.15rem',
                    xs: '1.05rem'
                  }
                }}
                noWrap
                fontWeight={500}
              >
                {space.name}
              </Typography>
            </Box>
            {space.joinDate && (
              <Typography variant='subtitle2'>
                {formatDate(space.joinDate)} - {space.latestEventDate ? formatDate(space.latestEventDate) : 'Present'}
              </Typography>
            )}
            <CountIcon icon={<HowToVoteIcon />} label='Votes' count={space.votes.length} />
            <CountIcon icon={<ForumIcon />} label='Proposals' count={space.proposals.length} />
            <CountIcon icon={<BountyIcon />} label='Rewards' count={space.bounties.length} />
          </Box>
          <Box display='flex' alignItems='center' gap={0.5}>
            {showVisibilityIcon && (
              <Tooltip title={`${visible ? 'Hide' : 'Show'} Organization from profile`}>
                <IconButton
                  className='action'
                  size='small'
                  onClick={(e) => {
                    // Don't want visibility icon to toggle the proposal and votes list
                    e.stopPropagation();
                    onClick();
                  }}
                  sx={{
                    opacity: {
                      md: 0,
                      sm: 1
                    }
                  }}
                >
                  {visible ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' />}
                </IconButton>
              </Tooltip>
            )}
            {isCollapsible && (
              <IconButton className='hidden-on-visible' size='small'>
                {isCollapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' />}
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={!isCollapsed}>
        <Box className='hidden-on-visible'>
          <Box my={1}>
            <MemberProperties properties={properties} />
          </Box>
          {showTabs && (
            <>
              <Tabs
                sx={{
                  mb: 2
                }}
                indicatorColor='primary'
                value={currentTab}
              >
                {hasVotes && <TaskTab task={TASK_TABS[0]} value={0} onClick={() => setCurrentTab(0)} />}
                {hasProposals && <TaskTab task={TASK_TABS[1]} value={1} onClick={() => setCurrentTab(1)} />}
                {hasBounties && <TaskTab task={TASK_TABS[2]} value={2} onClick={() => setCurrentTab(2)} />}
              </Tabs>
              <Stack gap={2}>
                {currentTab === 0 && <VotesPanel events={space.votes} />}
                {currentTab === 1 && <ProposalsPanel events={space.proposals} />}
                {currentTab === 2 && <BountyEventsPanel events={space.bounties} />}
              </Stack>
            </>
          )}
        </Box>
      </Collapse>
    </ProfileItemContainer>
  );
}

function CountIcon({ label, icon, count }: { label: string; icon: ReactNode; count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <Tooltip title={label}>
      <Typography variant='subtitle2' sx={{ pr: 1, gap: 0.5, display: 'inline-flex', alignItems: 'center' }}>
        <Box mt={0.5} sx={{ svg: { fontSize: '16px' } }}>
          {icon}
        </Box>{' '}
        {count}
      </Typography>
    </Tooltip>
  );
}

function TaskTab({ task, value, onClick }: { task: (typeof TASK_TABS)[number]; value: number; onClick: () => void }) {
  return (
    <Tab
      iconPosition='start'
      icon={task.icon}
      key={task.label}
      sx={{
        px: 1.5,
        fontSize: 14,
        minHeight: 0,
        '&.MuiTab-root': {
          color: 'palette.secondary.main'
        }
      }}
      label={task.label}
      value={value}
      onClick={onClick}
    />
  );
}

interface EventRowProps {
  eventNumber: number;
  icon: ReactNode;
  title: string | ReactNode;
  createdAt: string;
}

function EventRow(event: EventRowProps) {
  const { formatDate } = useDateFormatter();

  return (
    <Stack flexDirection='row' gap={1}>
      <Stack flexDirection='row' gap={1} alignItems='center' alignSelf='flex-start'>
        {event.icon}
        <Typography variant='body2' color='secondary'>
          {event.eventNumber || ' '}.
        </Typography>
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
        <Typography variant='body2' sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {event.title}
        </Typography>
        <Typography variant='subtitle1' color='secondary' textAlign={{ sm: 'left', md: 'right' }} minWidth={100}>
          {formatDate(event.createdAt)}
        </Typography>
      </Stack>
    </Stack>
  );
}

function VotesPanel({ events }: { events: ProfileVoteEvent[] }) {
  return (
    <>
      {events
        .sort((eventA, eventB) => (eventA.createdAt > eventB.createdAt ? -1 : 1))
        .map((event, index) => (
          <EventRow
            key={event.voteId}
            createdAt={event.createdAt}
            title={event.title}
            icon={
              event.successful ? (
                <ThumbUpIcon color='success' sx={{ fontSize: '16px' }} />
              ) : (
                <ThumbDownIcon color='error' sx={{ fontSize: '16px' }} />
              )
            }
            eventNumber={index + 1}
          />
        ))}
    </>
  );
}

function ProposalsPanel({ events }: { events: ProfileProposalEvent[] }) {
  return (
    <>
      {events
        .sort((eventA, eventB) => (eventA.createdAt > eventB.createdAt ? -1 : 1))
        .map((event, index) => (
          <EventRow
            key={event.proposalId}
            createdAt={event.createdAt}
            title={event.title}
            icon={
              event.outcome === event.voteChoice ? (
                <ThumbUpIcon color='success' sx={{ fontSize: '16px' }} />
              ) : (
                <ThumbDownIcon color='error' sx={{ fontSize: '16px' }} />
              )
            }
            eventNumber={index + 1}
          />
        ))}
    </>
  );
}

function BountyEventsPanel({ events }: { events: ProfileBountyEvent[] }) {
  return (
    <>
      {events
        .sort((eventA, eventB) => (eventA.createdAt > eventB.createdAt ? -1 : 1))
        .map((event, index) => (
          <EventRow
            key={event.bountyId}
            createdAt={event.createdAt}
            title={
              <>
                {bountyStatus(event.eventName)}:&nbsp;
                <Link href={event.bountyPath} color='inherit'>
                  <strong>{event.bountyTitle || 'Untitled'}</strong>
                </Link>
                {event.hasCredential && (
                  <Tooltip color='success' title='Verified with Collab.Land'>
                    <CheckIcon fontSize='small' />
                  </Tooltip>
                )}
              </>
            }
            icon={null}
            eventNumber={index + 1}
          />
        ))}
    </>
  );
}

function bountyStatus(status: ProfileBountyEvent['eventName']) {
  switch (status) {
    case 'bounty_created':
      return 'Created';
    case 'bounty_completed':
      return 'Completed';
    case 'bounty_started':
      return 'Started';
    default:
      return 'Event';
  }
}
