import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import charmClient from 'charmClient';
import UserDisplay from 'components/common/UserDisplay';
import type { ForumPostPage, ForumPostPageVote } from 'lib/forums/posts/interfaces';
import type { Member } from 'lib/members/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

import { PostVote } from './PostVote';

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
  post
}: ForumPostProps) {
  const date = new Date(updatedAt || createdAt);
  const relativeTime = getRelativeTimeInThePast(date);
  const [pagePost, setPagePost] = useState(post);
  const { id: postId } = pagePost;
  const currentUpvotedStatus = pagePost.upvoted;

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
      <CardActionArea>
        <CardContent>
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            {title}
          </Typography>
          <ForumPostContent galleryImage={galleryImage} contentText={contentText} title={title} />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Box display='flex' alignItems='center'>
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
            </Box>
            <PostVote votePost={votePost} {...pagePost} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
