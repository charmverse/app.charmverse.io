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
import { relativeTime } from 'lib/utilities/dates';
import type { PageContent } from 'models';

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
    rawText: ''
  });
  const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });

  async function onClickEditComment() {
    setIsEditingComment(true);
    menuState.close();
  }

  async function updateCommentContent(content: ICharmEditorOutput) {
    if (isEditingComment) {
      setCommentContent({
        doc: content.doc,
        rawText: content.rawText
      });
    }
  }

  useEffect(() => {
    setPostComment(comment);
  }, [comment]);

  async function saveCommentContent() {
    await charmClient.forum.updatePostComment({
      commentId: comment.id,
      content: commentContent.doc,
      contentText: commentContent.rawText,
      postId: comment.pageId
    });
    setIsEditingComment(false);
  }

  async function onClickDeleteComment() {}

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

  function cancelEditingComment() {
    setIsEditingComment(false);
    setCommentContent({
      doc: comment.content as PageContent,
      rawText: ''
    });
  }

  return (
    <Stack my={1}>
      <StyledStack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Avatar size='small' avatar={postComment.user.avatar} />
          <Typography>{postComment.user.username}</Typography>
          <Typography variant='subtitle1'>{relativeTime(postComment.createdAt)}</Typography>
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
      </StyledStack>
      <Box ml={3} position='relative'>
        <Box
          sx={{
            height: 'calc(100% - 24px)',
            width: 2.5,
            position: 'absolute',
            backgroundColor: theme.palette.background.light,
            left: -13.5,
            top: 10
          }}
        />
        <InlineCharmEditor
          style={{
            paddingTop: 0,
            paddingBottom: 0
          }}
          focusOnInit={false}
          readOnly={!isEditingComment}
          key={isEditingComment.toString()}
          onContentChange={updateCommentContent}
          content={commentContent.doc}
        />
        {isEditingComment && (
          <Stack flexDirection='row' my={1} ml={1} gap={1}>
            <Button size='small' onClick={saveCommentContent}>
              Save
            </Button>
            <Button size='small' variant='outlined' color='secondary' onClick={cancelEditingComment}>
              Cancel
            </Button>
          </Stack>
        )}
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
        <MenuItem onClick={onClickDeleteComment}>
          <ListItemIcon>
            <DeleteOutlinedIcon />
          </ListItemIcon>
          <ListItemText>Delete comment</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
