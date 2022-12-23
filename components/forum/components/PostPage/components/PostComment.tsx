import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useUser } from 'hooks/useUser';
import type { PostCommentVote, PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { relativeTime } from 'lib/utilities/dates';

import { ForumVote } from '../../ForumVote';

import { CommentReplyForm } from './CommentReplyForm';

const StyledStack = styled(Stack)`
  &:hover .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 1;
  }

  & .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 0;
  }
`;

export function PostComment({ comment }: { comment: PostCommentWithVoteAndChildren }) {
  const [postComment, setPostComment] = useState(comment);
  const [showCommentReply, setShowCommentReply] = useState(false);
  const theme = useTheme();
  const { user } = useUser();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentContent, setCommentContent] = useState<ICharmEditorOutput>({
    doc: comment.content as PageContent,
    rawText: comment.contentText
  });
  const [commentEditContent, setCommentEditContent] = useState<ICharmEditorOutput>(commentContent);

  async function saveCommentContent() {
    await charmClient.forum.updatePostComment({
      commentId: comment.id,
      content: commentEditContent.doc,
      contentText: commentEditContent.rawText,
      postId: comment.pageId
    });
    setCommentContent(commentEditContent);
    setIsEditingComment(false);
  }

  async function updateCommentContent(content: ICharmEditorOutput) {
    setCommentEditContent(content);
  }

  function cancelEditingComment() {
    setIsEditingComment(false);
    setCommentEditContent(commentContent);
  }

  const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });

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

  function onClickEditComment() {
    setIsEditingComment(true);
    menuState.close();
  }

  return (
    <Stack my={1} position='relative'>
      <StyledStack>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Stack flexDirection='row' alignItems='center'>
            <Avatar size='small' sx={{ mr: 1 }} avatar={postComment.user.avatar} />
            <Typography mr={1}>{postComment.user.username}</Typography>
            <Typography variant='subtitle1' mr={0.5}>
              {relativeTime(postComment.createdAt)}
            </Typography>
            {postComment.createdAt !== postComment.updatedAt && <Typography variant='subtitle2'>(Edited)</Typography>}
          </Stack>
          {comment.createdBy === user?.id && (
            <IconButton
              className='comment-actions'
              size='small'
              onClick={(event) => {
                menuState.open(event.currentTarget);
              }}
            >
              <MoreHorizIcon fontSize='small' />
            </IconButton>
          )}
        </Stack>
        <Box
          sx={{
            height: 'calc(100% - 50px)',
            width: 2.5,
            position: 'absolute',
            backgroundColor: theme.palette.background.light,
            top: 30,
            left: 10
          }}
        />
        <Box ml={3}>
          {isEditingComment ? (
            <>
              <InlineCharmEditor
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  backgroundColor: theme.palette.background.light
                }}
                focusOnInit
                onContentChange={updateCommentContent}
                content={commentEditContent.doc}
              />
              <Stack flexDirection='row' my={1} ml={1} gap={1}>
                <Button size='small' onClick={saveCommentContent}>
                  Save
                </Button>
                <Button size='small' variant='outlined' color='secondary' onClick={cancelEditingComment}>
                  Cancel
                </Button>
              </Stack>
            </>
          ) : (
            <InlineCharmEditor
              style={{
                paddingTop: 0,
                paddingBottom: 0
              }}
              readOnly
              key={isEditingComment.toString()}
              content={commentContent.doc}
            />
          )}
          <Stack flexDirection='row' gap={1}>
            <ForumVote votes={postComment} onVote={voteComment} />
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
        </Box>
      </StyledStack>
      <Box ml={3} position='relative'>
        {postComment.children.map((childComment) => (
          <PostComment comment={childComment} key={childComment.id} />
        ))}
      </Box>
      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={onClickEditComment}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit comment</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Delete comment</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
