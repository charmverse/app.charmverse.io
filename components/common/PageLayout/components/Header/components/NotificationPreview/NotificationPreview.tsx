import { useTheme } from '@emotion/react';
import CommentIcon from '@mui/icons-material/Comment';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import KeyIcon from '@mui/icons-material/Key';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Button, Divider, Typography } from '@mui/material';

import { useDateFormatter } from 'hooks/useDateFormatter';

type Props = {
  spaceName: string;
  createdAt: string;
  title: string;
  type: string;
};
export function NotificationPreview({ spaceName, createdAt, title, type }: Props) {
  const theme = useTheme();
  const { formatDate, formatTime } = useDateFormatter();
  const date = new Date(createdAt);
  const todaysDate = new Date();
  const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);

  const icon = (tastType: string) => {
    switch (tastType) {
      case 'multisig':
        return <KeyIcon fontSize='small' />;
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
  };

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
      {icon(type)}
      <Box width='100%'>
        <Box display='flex' alignItems='center' gap={1}>
          <Typography whiteSpace='nowrap'>
            {spaceName.length > 10 ? `${spaceName.substring(0, 10)}...` : spaceName}
          </Typography>
          <Divider sx={{ width: '4px' }} />
          <Typography color='secondary' whiteSpace='nowrap'>
            {isDateEqual ? formatTime(createdAt) : formatDate(createdAt)}
          </Typography>
        </Box>
        <Box>
          <Typography color='secondary'> {title.length > 23 ? `${title.substring(0, 23)}...` : title}</Typography>
        </Box>
      </Box>
      <Button sx={{ borderRadius: 20 }}>Action</Button>
    </Box>
  );
}
