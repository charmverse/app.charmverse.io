import { useTheme } from '@emotion/react';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Button, Divider, IconButton, Typography } from '@mui/material';
import type { NotificationType } from '@prisma/client';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import useTasks from 'components/nexus/hooks/useTasks';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { TaskUser } from 'lib/discussion/interfaces';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';

type Props = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor | TaskUser | null;
  title: string;
  type: NotificationType;
  groupType: NotificationGroupType;
  id: string;
};
export function NotificationPreview({ spaceName, createdAt, title, type, createdBy, groupType, id }: Props) {
  const theme = useTheme();
  // Task Date calculations:
  // const { formatDate, formatTime } = useDateFormatter();
  // const date = new Date(createdAt);
  // const todaysDate = new Date();
  // const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);

  const { mutate: mutateTasks } = useTasks();

  const header = `${spaceName} ${type}`;
  const description = `${createdBy?.username ? createdBy?.username : 'User'} ${title}`;

  const icon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case 'multisig':
        return <KeyIcon fontSize='small' />;
      case 'bounty':
        return <BountyIcon fontSize='small' />;
      case 'vote':
        return <HowToVoteIcon fontSize='small' />;
      case 'forum':
        return <CommentIcon fontSize='small' />;
      case 'proposal':
        return <TaskOutlinedIcon fontSize='small' />;
      case 'mention':
        return <ForumIcon fontSize='small' />;
      default:
        return <KeyIcon fontSize='small' />;
    }
  };

  async function markTask(taskId: string, taskType: NotificationGroupType) {
    await charmClient.tasks.markTasks([{ id: taskId, type }]);
    mutateTasks(
      (_tasks) => {
        if (!_tasks) {
          return;
        }

        const taskIndex = _tasks?.[taskType].unmarked.findIndex((t) => t.taskId === taskId);
        if (typeof taskIndex === 'number' && taskIndex > -1) {
          const marked = [_tasks?.forum.unmarked[taskIndex], ..._tasks.forum.marked];
          const unmarked = _tasks.forum.unmarked.filter((t) => t.taskId !== taskId);
          return {
            ..._tasks,
            [taskType]: {
              marked,
              unmarked
            }
          };
        }

        return _tasks;
      },
      {
        revalidate: false
      }
    );
  }

  return (
    <Box
      sx={{
        '&:hover': {
          cursor: 'default',
          background: theme.palette.background.light
        }
      }}
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      gap={2}
      p={2}
    >
      <Box display='flex' justifyContent='space-between' width='100%'>
        <Box>
          <Typography whiteSpace='nowrap'>{header.length > 28 ? `${header.substring(0, 28)}...` : header}</Typography>
          <Box width='100%' display='flex' alignItems='center' justifyContent='space-between'>
            <Box display='flex' alignItems='center' mr={2}>
              {createdBy ? <Avatar size='small' name={createdBy?.username} avatar={createdBy?.avatar} /> : icon(type)}
            </Box>
            <Box width='100%'>
              <Typography>
                {`${description.length > 45 ? `${description.substring(0, 45)}...` : description}`}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display='flex' alignItems='center'>
          <IconButton onClick={() => markTask(id, groupType)} size='small'>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
