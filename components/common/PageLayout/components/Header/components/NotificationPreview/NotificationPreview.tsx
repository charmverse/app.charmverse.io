import { useTheme } from '@emotion/react';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, IconButton, Typography } from '@mui/material';
import { useMemo } from 'react';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import type {
  MarkNotificationAsRead,
  NotificationDetails
} from 'components/common/PageLayout/components/Header/components/NotificationPreview/useNotificationPreview';
import type { NotificationGroupType } from 'lib/notifications/interfaces';

type Props = {
  notification: NotificationDetails;
  markAsRead: MarkNotificationAsRead;
};
export function NotificationPreview({ notification, markAsRead }: Props) {
  const { groupType, type, spaceName, createdBy, taskId, href, content, title } = notification;
  const theme = useTheme();

  const icon = useMemo(() => getIcon(groupType), [groupType]);

  return (
    <Link color='inherit' href={href}>
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
        pl={2}
        pr={1}
        py={1}
      >
        <Box display='flex' justifyContent='space-between' width='100%'>
          <Box overflow='hidden'>
            <Box display='flex'>
              <Box minWidth={0}>
                <Typography
                  whiteSpace='nowrap'
                  overflow='auto'
                  textOverflow='ellipsis'
                  variant='subtitle2'
                >{`${spaceName}`}</Typography>
              </Box>
              &nbsp;
              <Box whiteSpace='nowrap'>
                <Typography variant='subtitle2' fontWeight='bold'>
                  {title}
                </Typography>
              </Box>
            </Box>
            <Box width='100%' display='flex' alignItems='center' mt={0.5} justifyContent='space-between'>
              <Box display='flex' alignItems='center' mr={2}>
                {createdBy ? <Avatar size='small' name={createdBy?.username} avatar={createdBy?.avatar} /> : icon}
              </Box>
              <Box width='100%'>
                <Typography variant='subtitle1'>{content}</Typography>
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

function getIcon(groupType: NotificationGroupType) {
  switch (groupType) {
    case 'bounties':
      return <BountyIcon fontSize='small' />;
    case 'votes':
      return <HowToVoteIcon fontSize='small' />;
    case 'forum':
      return <CommentIcon fontSize='small' />;
    case 'proposals':
      return <TaskOutlinedIcon fontSize='small' />;
    case 'discussions':
      return <ForumIcon fontSize='small' />;
    default:
      return <KeyIcon fontSize='small' />;
  }
}
