import { useTheme } from '@emotion/react';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Badge, Box, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Legend from 'components/settings/Legend';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import BountyTasksList from './BountyTasksList';
import NotifyMeButton from './components/NotifyMeButton';
import SnoozeButton from './components/SnoozeButton';
import DiscussionTasksList from './DiscussionTasksList';
import ForumTasksList from './ForumTasksList';
import { GnosisTasksList } from './GnosisTasksList';
import useTasks from './hooks/useTasks';
import ProposalTasksList from './ProposalTasksList';
import { VoteTasksList } from './VoteTasksList';

export const tabStyles = {
  my: 2,
  minHeight: {
    xs: '34px',
    sm: '48px'
  },
  '.MuiTab-root': {
    p: {
      xs: 0,
      sm: 1
    },
    minWidth: {
      xs: 'fit-content',
      sm: '90px'
    },
    flexGrow: {
      xs: 1,
      sm: 'revert'
    }
  }
};

const TASK_TABS = [
  { icon: <KeyIcon />, label: 'Multisig', type: 'multisig' },
  { icon: <BountyIcon />, label: 'Bounty', type: 'bounty' },
  { icon: <HowToVoteIcon />, label: 'Poll', type: 'vote' },
  { icon: <ForumIcon />, label: 'Discussion', type: 'discussion' },
  { icon: <TaskOutlinedIcon />, label: 'Proposal', type: 'proposal' },
  { icon: <CommentIcon />, label: 'Forum', type: 'forum' }
] as const;

type TaskType = (typeof TASK_TABS)[number]['type'];

export type TasksPageProps = { taskType?: TaskType };

export default function TasksPage() {
  const router = useRouter();
  const { user } = useUser();
  const { pathProps } = useSettingsDialog();
  // check from list of tabs to make sure task type is valid
  const defaultTab = TASK_TABS.find((taskTab) => taskTab.type === pathProps?.taskType);
  const [currentTaskType, setCurrentTaskType] = useState<TaskType>(defaultTab?.type ?? TASK_TABS[0].type);
  const { error, mutate: mutateTasks, tasks, gnosisTasks, gnosisTasksServerError, mutateGnosisTasks } = useTasks();
  const theme = useTheme();

  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'nexus' });
  }, []);

  const userNotificationState = user?.notificationState;
  const hasSnoozedNotifications =
    userNotificationState &&
    userNotificationState.snoozedUntil &&
    new Date(userNotificationState.snoozedUntil) > new Date();

  const unvoted = tasks?.votes.filter((vote) => !vote.userChoice && new Date() < new Date(vote.deadline));

  const notificationCount: Record<(typeof TASK_TABS)[number]['type'], number> = {
    multisig:
      gnosisTasks && !hasSnoozedNotifications ? gnosisTasks.filter((gnosisTask) => !gnosisTask.marked).length : 0,
    vote: unvoted ? unvoted.length : 0,
    discussion: tasks ? tasks.discussions.unmarked.length : 0,
    proposal: tasks ? tasks.proposals.unmarked.length : 0,
    bounty: tasks ? tasks.bounties?.unmarked.length : 0,
    forum: tasks ? tasks.forum?.unmarked.length : 0
  };

  return (
    <>
      <Legend variant='inherit' variantMapping={{ inherit: 'div' }} display='flex' justifyContent='space-between'>
        <Typography variant='h2' fontSize='inherit' fontWeight={700}>
          My Tasks
        </Typography>
        <Box
          display='flex'
          alignItems='center'
          justifyContent={{ sm: 'flex-end', xs: 'flex-start' }}
          mr={{ md: 6 }}
          gap={{ sm: 2, xs: 1 }}
        >
          <NotifyMeButton />
          {currentTaskType === 'multisig' ? <SnoozeButton /> : null}
        </Box>
      </Legend>
      <Tabs
        sx={tabStyles}
        indicatorColor='primary'
        value={TASK_TABS.findIndex((taskTab) => taskTab.type === currentTaskType)}
      >
        {TASK_TABS.map((task) => (
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
              mb: {
                xs: 1,
                md: 0
              },
              '&.MuiTab-root': {
                color: theme.palette.secondary.main,
                display: 'flex',
                flexDirection: {
                  xs: 'column',
                  md: 'row'
                }
              },
              '& .MuiSvgIcon-root': {
                mr: {
                  xs: 0,
                  md: 1
                }
              }
            }}
            label={
              <Badge
                sx={{
                  '& .MuiBadge-badge': {
                    right: {
                      md: -3,
                      xs: 15
                    },
                    top: {
                      md: 0,
                      xs: -20
                    }
                  }
                }}
                invisible={notificationCount[task.type] === 0}
                color='error'
                variant='dot'
              >
                {task.label}
              </Badge>
            }
            onClick={() => {
              setUrlWithoutRerender(router.pathname, { task: task.type });
              setCurrentTaskType(task.type);
            }}
          />
        ))}
      </Tabs>
      {currentTaskType === 'multisig' && (
        <GnosisTasksList error={gnosisTasksServerError} mutateTasks={mutateGnosisTasks} tasks={gnosisTasks} />
      )}
      {currentTaskType === 'discussion' && (
        <DiscussionTasksList includedDiscussions={['page']} mutateTasks={mutateTasks} error={error} tasks={tasks} />
      )}
      {currentTaskType === 'vote' && <VoteTasksList mutateTasks={mutateTasks} error={error} tasks={tasks} />}
      {currentTaskType === 'proposal' && <ProposalTasksList error={error} tasks={tasks} mutateTasks={mutateTasks} />}
      {currentTaskType === 'bounty' && <BountyTasksList error={error} tasks={tasks} mutateTasks={mutateTasks} />}
      {currentTaskType === 'forum' && <ForumTasksList mutateTasks={mutateTasks} error={error} tasks={tasks} />}
    </>
  );
}
