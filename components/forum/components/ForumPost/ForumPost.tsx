import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import UserDisplay from 'components/common/UserDisplay';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

export type ForumPostProps = ForumPostPage & {
  user?: Member;
};

const maxCharactersInPost = 140;

function ForumPostContent({
  galleryImage,
  title,
  contentText
}: Pick<ForumPostProps, 'galleryImage' | 'title' | 'contentText'>) {
  // Only show published posts
  if (galleryImage) {
    return (
      <img src={galleryImage} alt={title || 'Post'} width='100%' style={{ maxHeight: '250px', objectFit: 'cover' }} />
    );
  } else if (title) {
    return <Typography variant='body2'>{fancyTrim(contentText, maxCharactersInPost)}</Typography>;
  }

  return null;
}

export default function ForumPost({
  createdAt,
  updatedAt,
  user,
  title,
  contentText,
  galleryImage,
  postId,
  headerImage
}: ForumPostProps) {
  const date = new Date(updatedAt || createdAt);
  const relativeTime = getRelativeTimeInThePast(date);
  const { showPage } = usePageDialog();
  const router = useRouter();

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea
        onClick={() => {
          showPage({
            pageId: postId,
            onClose() {
              setUrlWithoutRerender(router.pathname, { postId: null });
            }
          });
          setUrlWithoutRerender(router.pathname, { postId });
        }}
      >
        <CardContent>
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            {title}
          </Typography>
          <ForumPostContent galleryImage={galleryImage || headerImage} contentText={contentText} title={title} />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <UserDisplay
                user={user}
                avatarSize='small'
                fontSize='medium'
                sx={{ '> p': { display: { xs: 'none', sm: 'block' } } }}
              />
              {/** Re-enable this once we have a number of comments 
                 <Box display='flex' alignItems='center' padding='0 15px'>
                  <MessageOutlined fontSize='small' sx={{ pr: '5px' }} />
                  {commentsNumber}
                </Box>
              */}
              <Box display='flex' alignItems='center'>
                <AccessTimeIcon fontSize='small' sx={{ pr: '5px' }} />
                {relativeTime}
              </Box>
            </Stack>
            {/**
               * 
               * Re-enable this once we have up / downvoting as a feature
               * Should be exracted to a separate widget component that handles up/down voting
               * 
                <Box display='flex' alignItems='center'>
                  <NorthIcon fontSize='small' />
                  {upVotes}
                  <SouthIcon fontSize='small' />
                  {downVotes}
                </Box> 
               */}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
