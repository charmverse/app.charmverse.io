import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import type { PostCommentVote, PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import { relativeTime } from 'lib/utilities/dates';
import type { PageContent } from 'models';

import { ForumVote } from '../../ForumVote';

import { CommentReplyForm } from './CommentReplyForm';

export function PostComment({ comment }: { comment: PostCommentWithVoteAndChildren }) {
  const [postComment, setPostComment] = useState(comment);
  const [showCommentReply, setShowCommentReply] = useState(false);

  useEffect(() => {
    setPostComment(comment);
  }, [comment]);

  async function voteComment(newUpvotedStatus?: boolean) {
    await charmClient.forum.voteComment({
      postId: postComment.pageId,
      commentId: postComment.id,
      upvoted: newUpvotedStatus
    });

    const postCommentVote: PostCommentVote = {
      downvotes: postComment.downvotes,
      upvotes: postComment.upvotes,
      upvoted: newUpvotedStatus
    };

    if (newUpvotedStatus === true) {
      postCommentVote.upvotes += 1;
      if (postComment.upvoted === false) {
        postCommentVote.downvotes -= 1;
      }
    } else if (newUpvotedStatus === false) {
      postCommentVote.downvotes += 1;
      if (postComment.upvoted === true) {
        postCommentVote.upvotes -= 1;
      }
    } else if (postComment.upvoted === true) {
      postCommentVote.upvotes -= 1;
    } else {
      postCommentVote.downvotes -= 1;
    }

    setPostComment({
      ...postComment,
      ...postCommentVote
    });
  }

  return (
    <Stack my={1}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        <Avatar size='small' avatar={postComment.user.avatar} />
        <Typography>{postComment.user.username}</Typography>
        <Typography variant='subtitle1'>{relativeTime(postComment.createdAt)}</Typography>
      </Stack>
      <Box ml={3}>
        <InlineCharmEditor
          style={{
            paddingTop: 0,
            paddingBottom: 0
          }}
          focusOnInit={false}
          readOnly
          content={postComment.content as PageContent}
        />
        <Stack flexDirection='row' gap={1}>
          <ForumVote
            downvotes={postComment.downvotes}
            upvotes={postComment.upvotes}
            vote={voteComment}
            upvoted={postComment.upvoted}
          />
          <Typography
            sx={{
              cursor: 'pointer'
            }}
            onClick={() => setShowCommentReply(true)}
          >
            Reply
          </Typography>
        </Stack>
        <Box mt={2}>
          {showCommentReply && (
            <CommentReplyForm
              commentId={comment.id}
              onCreateComment={() => {}}
              onCancelComment={() => setShowCommentReply(false)}
              postId={comment.pageId}
            />
          )}
        </Box>
        {postComment.children.map((childComment) => (
          <PostComment comment={childComment} key={childComment.id} />
        ))}
      </Box>
    </Stack>
  );
}
