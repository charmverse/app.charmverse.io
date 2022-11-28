import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageOutlined from '@mui/icons-material/MessageOutlined';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import UserDisplay from 'components/common/UserDisplay';
import { ForumPostContent } from 'lib/forum/interfaces';
import type { ForumPost } from 'lib/forum/interfaces';
import type { Member } from 'lib/members/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

interface ForumPostProps extends Omit<ForumPost, 'userId'> {
  user?: Member;
}

function ForumPostContent({ content, title }: { content: ForumPostContent; title?: string }) {
  if (content.type === 'text') {
    return <Typography>{content.content}</Typography>;
  }
  if (content.type === 'image') {
    return <img src={content.content} alt={title || 'Post'} width='100%' />;
  }

  return null;
}

export default function ForumPost({
  title,
  user,
  content,
  commentsNumber,
  upVotes,
  downVotes,
  createdAt,
  updatedAt
}: ForumPostProps) {
  const date = new Date(updatedAt || createdAt);
  const relativeTime = getRelativeTimeInThePast(date);

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea>
        <CardContent>
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            {title}
          </Typography>
          <ForumPostContent content={content} title={title} />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Box display='flex' alignItems='center'>
              <UserDisplay
                user={user}
                avatarSize='small'
                fontSize='medium'
                sx={{ '> p': { display: { xs: 'none', sm: 'block' } } }}
              />
              <Box display='flex' alignItems='center' padding='0 15px'>
                <MessageOutlined fontSize='small' sx={{ pr: '5px' }} />
                {commentsNumber}
              </Box>
              <Box display='flex' alignItems='center'>
                <AccessTimeIcon fontSize='small' sx={{ pr: '5px' }} />
                {relativeTime}
              </Box>
            </Box>
            <Box display='flex' alignItems='center'>
              <NorthIcon fontSize='small' />
              {upVotes}
              <SouthIcon fontSize='small' />
              {downVotes}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
