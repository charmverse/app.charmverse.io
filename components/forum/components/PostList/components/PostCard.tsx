import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useState } from 'react';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import type { ForumPostPage, ForumPostPageVote } from 'lib/forums/posts/interfaces';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

import { ForumVote } from '../../ForumVote';

export type ForumPostProps = ForumPostPage & {
  user?: Member;
  totalComments: number;
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

export function PostCard({
  createdAt,
  updatedAt,
  user,
  title,
  contentText,
  galleryImage,
  post,
  headerImage,
  totalComments
}: ForumPostProps) {
  const date = new Date(updatedAt || createdAt);
  const relativeTime = getRelativeTimeInThePast(date);
  const [pagePost, setPagePost] = useState(post);
  const { id: postId } = pagePost;
  const currentUpvotedStatus = pagePost.upvoted;
  const router = useRouter();
  const { showPost } = usePostDialog();

  async function votePost(newUpvotedStatus?: boolean) {
    await charmClient.forum.votePost({
      postId,
      upvoted: newUpvotedStatus
    });

    const forumPostPageVote: ForumPostPageVote = {
      downvotes: pagePost.downvotes,
      upvotes: pagePost.upvotes,
      upvoted: newUpvotedStatus
    };

    if (newUpvotedStatus === true) {
      forumPostPageVote.upvotes += 1;
      if (currentUpvotedStatus === false) {
        forumPostPageVote.downvotes -= 1;
      }
    } else if (newUpvotedStatus === false) {
      forumPostPageVote.downvotes += 1;
      if (currentUpvotedStatus === true) {
        forumPostPageVote.upvotes -= 1;
      }
    } else if (currentUpvotedStatus === true) {
      forumPostPageVote.upvotes -= 1;
    } else {
      forumPostPageVote.downvotes -= 1;
    }

    setPagePost({
      ...pagePost,
      ...forumPostPageVote
    });
  }

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea
        onClick={() => {
          showPost({
            postId,
            onClose() {
              setUrlWithoutRerender(router.pathname, { pageId: null });
            }
          });
          setUrlWithoutRerender(router.pathname, { pageId: postId });
        }}
      >
        <CardContent>
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            {title}
          </Typography>
          <ForumPostContent galleryImage={galleryImage || headerImage} contentText={contentText} title={title} />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Stack flexDirection='row' gap={2} alignItems='center'>
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

              <Stack flexDirection='row' gap={0.5} alignItems='center'>
                <AccessTimeIcon fontSize='small' />
                <Typography variant='body2'>{relativeTime}</Typography>
              </Stack>

              <Stack flexDirection='row' gap={0.5} alignItems='center'>
                <ModeCommentOutlinedIcon fontSize='small' />
                <Typography variant='body2'>{totalComments}</Typography>
              </Stack>
            </Stack>
            <ForumVote vote={votePost} {...pagePost} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
