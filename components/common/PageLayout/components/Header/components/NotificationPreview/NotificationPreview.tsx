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
import type { MarkNotificationAsRead } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';
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
  groupType: NotificationGroupType;
  taskId: string;
  type: NotificationType;
  markAsRead: MarkNotificationAsRead;
};
export function NotificationPreview({
  spaceName,
  createdAt,
  title,
  createdBy,
  groupType,
  taskId,
  type,
  markAsRead
}: Props) {
  const theme = useTheme();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

  // Task Date calculations:
  // const { formatDate, formatTime } = useDateFormatter();
  // const date = new Date(createdAt);
  // const todaysDate = new Date();
  // const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);

  // const taskLink = (taskGroupType: NotificationGroupType) => {
  //   if (groupType === 'discussions') {
  //     return `${baseUrl}/${spaceDomain}/${pagePath}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`;
  //   }
  //   if (groupType === 'bounties') {
  //     return `${baseUrl}/${spaceDomain}/bounties?bountyId=${bountyId}`;
  //   }
  //   if (groupType === 'votes') {
  //     return `/${spaceDomain}/${pagePath}?voteId=${id}`;
  //   }
  //   if (groupType === 'proposals') {
  //     return `/${spaceDomain}/${pagePath}`;
  //   }
  //   if (groupType === 'forum') {
  //     return `${baseUrl}/${spaceDomain}/forum/post/${postPath}`;
  //   }
  // };

  // @TODOM - map group type to proper title
  const taskTitle = (taskGroupType: NotificationGroupType) => {
    switch (taskGroupType) {
      case 'discussions':
        return 'Discussion';
      case 'bounties':
        return 'Bounty created';
      case 'votes':
        return 'Vote Opened';
      case 'forum':
        return 'Forum Post Reply';
      case 'proposals':
        return 'Proposal Vote opened';
      default:
        return '';
    }
  };
  const header = `${spaceName.length > 14 ? `${spaceName.substring(0, 14)}...` : spaceName} ${groupType}`;
  // @TODOM - map title to proper action title (i.e @asd left comment in ${title})
  const taskDescription = () => {
    if (groupType === 'discussions') {
      return `${createdBy?.username} left a comment in ${spaceName}.`;
    }
    if (groupType === 'bounties') {
      return createdBy?.username ? `${createdBy?.username} created a bounty.` : 'Bounty created.';
    }
    if (groupType === 'votes') {
      return createdBy?.username ? `${createdBy?.username} created a poll.` : 'Poll created.';
    }
    if (groupType === 'proposals') {
      return createdBy?.username ? `${createdBy?.username} created a proposal.` : 'Proposal created.';
    }
    if (groupType === 'forum') {
      return createdBy?.username ? `${createdBy?.username} created post on forum.` : 'Forum post creaed.';
    }
  };

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

  return (
    <Box
      sx={{
        '&:hover': {
          cursor: 'pointer',
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
          <Typography whiteSpace='nowrap'>{header}</Typography>
          <Box width='100%' display='flex' alignItems='center' mt={1} justifyContent='space-between'>
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
          <IconButton onClick={() => markAsRead({ taskId, groupType, type })} size='small'>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
