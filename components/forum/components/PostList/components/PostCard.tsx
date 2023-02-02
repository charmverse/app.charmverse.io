import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ModeCommentOutlinedIcon from '@mui/icons-material/ModeCommentOutlined';
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { PostCategory } from '@prisma/client';
import { useRouter } from 'next/router';
import { useState } from 'react';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import { usePostDialog } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import { usePostPermissions } from 'components/forum/hooks/usePostPermissions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { ForumPostMeta, ForumVotes } from 'lib/forums/posts/interfaces';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

import { ForumVote } from '../../ForumVote';

import { PostSummary } from './PostSummary';

const maxCharactersInPost = 140;

export type ForumPostProps = {
  user?: Member;
  category?: PostCategory;
  post: ForumPostMeta & { totalComments: number };
};

export function PostCard({ post, user, category }: ForumPostProps) {
  const { createdAt, totalComments } = post;
  const date = new Date(createdAt);
  const relativeTime = getRelativeTimeInThePast(date);
  const [pagePost, setPagePost] = useState(post);
  const { id: postId } = pagePost;
  const router = useRouter();
  const { showPost } = usePostDialog();
  const currentSpace = useCurrentSpace();

  const { permissions } = usePostPermissions(post.id);

  async function voteOnPost(newUpvotedStatus: boolean | null) {
    await charmClient.forum.voteOnPost({
      postId,
      upvoted: newUpvotedStatus
    });

    const forumPostPageVote: ForumVotes = {
      downvotes: pagePost.votes.downvotes,
      upvotes: pagePost.votes.upvotes,
      upvoted: newUpvotedStatus
    };

    const upvotedByCurrentUser = pagePost.votes.upvoted;

    if (newUpvotedStatus === true) {
      forumPostPageVote.upvotes += 1;
      if (upvotedByCurrentUser === false) {
        forumPostPageVote.downvotes -= 1;
      }
    } else if (newUpvotedStatus === false) {
      forumPostPageVote.downvotes += 1;
      if (upvotedByCurrentUser === true) {
        forumPostPageVote.upvotes -= 1;
      }
    } else if (upvotedByCurrentUser === true) {
      forumPostPageVote.upvotes -= 1;
    } else {
      forumPostPageVote.downvotes -= 1;
    }

    setPagePost({
      ...pagePost,
      votes: forumPostPageVote
    });
  }

  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea
        component='div'
        onClick={() => {
          showPost({
            postId,
            onClose() {
              setUrlWithoutRerender(router.pathname, { postId: null });
            }
          });
          if (currentSpace) {
            charmClient.track.trackAction('load_post_page', {
              resourceId: postId,
              spaceId: currentSpace.id
            });
          }
          setUrlWithoutRerender(router.pathname, { postId });
        }}
      >
        <CardContent>
          {category?.name && (
            <Typography variant='caption' component='div' mb={1} fontWeight={500}>
              {category.name}
            </Typography>
          )}
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            {fancyTrim(post.title, maxCharactersInPost)}
          </Typography>
          <PostSummary content={post.summary} postId={postId} />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Stack flexDirection='row' gap={2} alignItems='center'>
              <UserDisplay
                user={user}
                avatarSize='small'
                fontSize='medium'
                sx={{ '> p': { display: { xs: 'none', sm: 'block' } } }}
              />
              <Stack flexDirection='row' gap={0.5} alignItems='center'>
                <AccessTimeIcon fontSize='small' />
                <Typography variant='body2'>{relativeTime}</Typography>
              </Stack>

              <Stack flexDirection='row' gap={0.5} alignItems='center'>
                <ModeCommentOutlinedIcon fontSize='small' />
                <Typography variant='body2'>{totalComments}</Typography>
              </Stack>
            </Stack>
            <ForumVote permissions={permissions} onVote={voteOnPost} votes={pagePost.votes} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
