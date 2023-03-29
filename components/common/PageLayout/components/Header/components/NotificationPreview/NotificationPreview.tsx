import { useTheme } from '@emotion/react';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import type { NotificationType } from '@prisma/client';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import type { MarkNotificationAsRead } from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';
import type { TaskUser } from 'lib/discussion/interfaces';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';

type TaskProps = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor | TaskUser | null;
  title: string;
  groupType: NotificationGroupType;
  type: NotificationType;
  spaceDomain: string;
  path: string | null;
  commentId: string | null;
  mentionId: string | null;
  bountyId: string | null;
  action: string | null;
};

type Props = {
  task: TaskProps;
  markAsRead: MarkNotificationAsRead;
  taskId: string;
};
export function NotificationPreview({ task, markAsRead, taskId }: Props) {
  const {
    groupType,
    spaceDomain,
    path,
    commentId,
    mentionId,
    bountyId,
    type,
    spaceName,
    createdAt,
    createdBy,
    title,
    action
  } = task;

  const theme = useTheme();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

  // Task Date calculations:
  // const { formatDate, formatTime } = useDateFormatter();
  // const date = new Date(createdAt);
  // const todaysDate = new Date();
  // const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);

  const taskHref = () => {
    if (groupType === 'discussions') {
      return `${baseUrl}/${spaceDomain}/${path}?${commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`}`;
    }
    if (groupType === 'bounties') {
      return `${baseUrl}/${spaceDomain}/bounties?bountyId=${bountyId}`;
    }
    if (groupType === 'votes') {
      return `/${spaceDomain}/${path}?voteId=${taskId}`;
    }
    if (groupType === 'proposals') {
      return `/${spaceDomain}/${path}`;
    }
    if (groupType === 'forum') {
      return `${baseUrl}/${spaceDomain}/forum/post/${path}`;
    }
  };

  const taskTitle = (taskGroupType: NotificationGroupType) => {
    switch (taskGroupType) {
      case 'discussions':
        return 'Discussion';
      case 'bounties':
        return 'Bounty';
      case 'votes':
        return 'New Voting';
      case 'forum':
        return 'Forum Post';
      case 'proposals':
        return 'Proposal';
      default:
        return '';
    }
  };

  const taskDescription = () => {
    if (action === 'application_pending') {
      return `You applied for ${title} bounty.`;
    }
    if (action === 'application_approved') {
      return `You application for ${title} bounty is approved.`;
    }
    if (groupType === 'discussions') {
      return `${createdBy?.username} left a comment in ${spaceName}.`;
    }
    if (groupType === 'bounties') {
      return createdBy?.username ? `${createdBy?.username} created a bounty.` : 'Bounty created.';
    }
    if (groupType === 'votes') {
      return createdBy?.username ? `${createdBy?.username} created a poll "${title}".` : `Poll "${title}" created.`;
    }
    if (groupType === 'proposals') {
      return createdBy?.username ? `${createdBy?.username} created a proposal.` : 'Proposal created.';
    }
    if (groupType === 'forum') {
      return createdBy?.username
        ? `${createdBy?.username} created "${title}" post on forum.`
        : `Forum post "${title}" creaed.`;
    }
  };
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
    <Link color='inherit' href={taskHref()}>
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
          <Box overflow='hidden'>
            <Box display='flex'>
              <Box minWidth={0}>
                <Typography whiteSpace='nowrap' overflow='auto' textOverflow='ellipsis'>{`${spaceName}`}</Typography>
              </Box>
              &nbsp;
              <Box whiteSpace='nowrap'>
                <Typography>{taskTitle(groupType)}</Typography>
              </Box>
            </Box>
            <Box width='100%' display='flex' alignItems='center' mt={1} justifyContent='space-between'>
              <Box display='flex' alignItems='center' mr={2}>
                {createdBy ? <Avatar size='small' name={createdBy?.username} avatar={createdBy?.avatar} /> : icon(type)}
              </Box>
              <Box width='100%'>
                <Typography>{taskDescription()}</Typography>
              </Box>
            </Box>
          </Box>
          <Box display='flex' alignItems='center'>
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                markAsRead({ taskId, groupType, type });
              }}
              size='small'
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Link>
  );
}
