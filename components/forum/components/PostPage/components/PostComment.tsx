import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Button from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type {
  PostCommentVote,
  PostCommentWithVote,
  PostCommentWithVoteAndChildren
} from 'lib/forums/comments/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

import { ForumContentUpDownVotes } from '../../ForumVote';

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

export function PostComment({
  comment,
  setPostComments
}: {
  comment: PostCommentWithVoteAndChildren;
  setPostComments: KeyedMutator<PostCommentWithVote[]>;
}) {
  const [showCommentReply, setShowCommentReply] = useState(false);
  const theme = useTheme();
  const { user } = useUser();
  const { members } = useMembers();
  const commentUser = members.find((member) => member.id === comment.createdBy);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentContent, setCommentContent] = useState<ICharmEditorOutput>({
    doc: comment.content as PageContent,
    rawText: comment.contentText
  });
  const [commentEditContent, setCommentEditContent] = useState<ICharmEditorOutput>(commentContent);

  async function saveCommentContent() {
    const updatedComment = await charmClient.forum.updatePostComment({
      commentId: comment.id,
      content: commentEditContent.doc,
      contentText: commentEditContent.rawText,
      postId: comment.pageId
    });
    setCommentContent(commentEditContent);
    setIsEditingComment(false);
    setPostComments((comments) =>
      comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, ...updatedComment } : _comment))
    );
  }

  async function updateCommentContent(content: ICharmEditorOutput) {
    setCommentEditContent(content);
  }

  function cancelEditingComment() {
    setIsEditingComment(false);
    setCommentEditContent(commentContent);
  }

  function onCreateComment(_comment: PostCommentWithVote) {
    setPostComments((comments) => (comments ? [_comment, ...comments] : []));
  }

  const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });

  async function voteComment(newUpvotedStatus: boolean | null) {
    await charmClient.forum.upOrDownVoteComment({
      postId: comment.pageId,
      commentId: comment.id,
      upvoted: newUpvotedStatus
    });

    const postCommentVote: PostCommentVote = {
      downvotes: comment.downvotes,
      upvotes: comment.upvotes,
      upvoted: newUpvotedStatus
    };

    if (newUpvotedStatus === true) {
      postCommentVote.upvotes += 1;
      if (comment.upvoted === false) {
        postCommentVote.downvotes -= 1;
      }
    } else if (newUpvotedStatus === false) {
      postCommentVote.downvotes += 1;
      if (comment.upvoted === true) {
        postCommentVote.upvotes -= 1;
      }
    } else if (comment.upvoted === true) {
      postCommentVote.upvotes -= 1;
    } else {
      postCommentVote.downvotes -= 1;
    }

    setPostComments((comments) =>
      comments?.map((_comment) =>
        _comment.id === comment.id
          ? {
              ...comment,
              ...postCommentVote
            }
          : _comment
      )
    );
  }

  function onClickEditComment() {
    setIsEditingComment(true);
    menuState.close();
  }

  async function onClickDeleteComment() {
    await charmClient.forum.deletePostComment({ commentId: comment.id, postId: comment.pageId });
    setPostComments((comments) =>
      comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, deletedAt: new Date() } : _comment))
    );
    menuState.close();
  }

  return (
    <Stack my={1} position='relative'>
      <StyledStack>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Stack flexDirection='row' alignItems='center'>
            <Avatar size='small' sx={{ mr: 1 }} avatar={commentUser?.avatar} />
            <Typography mr={1}>{commentUser?.username}</Typography>
            <Typography variant='subtitle1' mr={0.5}>
              {getRelativeTimeInThePast(new Date(comment.createdAt))}
            </Typography>
            {comment.createdAt !== comment.updatedAt && <Typography variant='subtitle2'>(Edited)</Typography>}
          </Stack>
          {comment.createdBy === user?.id && !comment.deletedAt && (
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
            <Stack>
              <InlineCharmEditor
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginLeft: 8,
                  minHeight: 100,
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
            </Stack>
          ) : comment.deletedAt ? (
            <Typography color='secondary'>Comment deleted by user</Typography>
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
          {!comment.deletedAt && (
            <Stack flexDirection='row' gap={1}>
              <ForumContentUpDownVotes votes={comment} onVote={voteComment} />
              <Typography
                sx={{
                  cursor: 'pointer'
                }}
                onClick={() => setShowCommentReply(true)}
                color='secondary'
                fontWeight='semibold'
                variant='subtitle1'
              >
                Reply
              </Typography>
            </Stack>
          )}
          <Box mt={2}>
            {showCommentReply && (
              <CommentReplyForm
                commentId={comment.id}
                onCreateComment={onCreateComment}
                onCancelComment={() => setShowCommentReply(false)}
                postId={comment.pageId}
              />
            )}
          </Box>
        </Box>
      </StyledStack>
      <Box ml={3} position='relative'>
        {comment.children.map((childComment) => (
          <PostComment setPostComments={setPostComments} comment={childComment} key={childComment.id} />
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
