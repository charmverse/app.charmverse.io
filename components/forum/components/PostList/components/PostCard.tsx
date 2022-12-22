import AccessTimeIcon from '@mui/icons-material/AccessTime';
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
import type { ForumPostMeta, ForumVotes } from 'lib/forums/posts/interfaces';
import type { Member } from 'lib/members/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

import { PostSummary } from './PostSummary';
import { PostVote } from './PostVote';

const maxCharactersInPost = 140;

export type ForumPostProps = {
  post: ForumPostMeta;
  user?: Member;
};

export function PostCard({ post, user }: ForumPostProps) {
  const { createdAt, votes, updatedAt } = post;
  const date = new Date(updatedAt || createdAt);
  const relativeTime = getRelativeTimeInThePast(date);
  const [pagePost, setPagePost] = useState(post);
  const { id: postId } = pagePost;
  const currentUpvotedStatus = votes.upvoted;
  const router = useRouter();
  const { showPost } = usePostDialog();

  async function voteOnPost(newUpvotedStatus?: boolean) {
    await charmClient.forum.voteOnPost({
      postId,
      upvoted: newUpvotedStatus
    });

    const forumPostPageVote: ForumVotes = {
      downvotes: votes.downvotes,
      upvotes: votes.upvotes,
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
            {fancyTrim(post.title, maxCharactersInPost)}
          </Typography>
          <PostSummary content={post.summary} />
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
            <PostVote onVote={voteOnPost} votes={pagePost.votes} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
