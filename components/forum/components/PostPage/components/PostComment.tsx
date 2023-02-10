import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import UserDisplay from 'components/common/UserDisplay';
import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type {
  PostCommentVote,
  PostCommentWithVote,
  PostCommentWithVoteAndChildren
} from 'lib/forums/comments/interface';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import type { AvailablePostPermissionFlags } from 'lib/permissions/forum/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { getRelativeTimeInThePast } from 'lib/utilities/dates';

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

type Props = {
  comment: PostCommentWithVoteAndChildren;
  setPostComments: KeyedMutator<PostCommentWithVote[] | undefined>;
  permissions?: AvailablePostPermissionFlags;
  post: PostWithVotes | null;
};

export function PostComment({ post, comment, setPostComments, permissions }: Props) {
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
  const { showMemberProfile } = useMemberProfile();

  async function saveCommentContent() {
    const updatedComment = await charmClient.forum.updatePostComment({
      commentId: comment.id,
      content: commentEditContent.doc,
      contentText: commentEditContent.rawText,
      postId: comment.postId
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
      postId: comment.postId,
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
    menuState.close();
    await charmClient.forum.deletePostComment({ commentId: comment.id, postId: comment.postId });
    setPostComments((comments) =>
      comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, deletedAt: new Date() } : _comment))
    );
  }

  const isCommentAuthor = comment.createdBy === user?.id;
  const canDeleteComment = (permissions?.delete_comments || isCommentAuthor) && !post?.proposalId;

  return (
    <Stack my={1} position='relative'>
      {/** test marker is here to avoid accidentally loading comments from recursive post comment components */}
      <StyledStack data-test={`post-comment-${comment.id}`}>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Stack flexDirection='row' alignItems='center'>
            <Box mr={1}>
              <UserDisplay showMiniProfile avatarSize='small' user={commentUser} hideName={true} />
            </Box>
            <Typography
              mr={1}
              onClick={() => {
                if (commentUser) {
                  showMemberProfile(commentUser.id);
                }
              }}
            >
              {commentUser?.username}
            </Typography>
            <Typography variant='subtitle1' mr={0.5}>
              {getRelativeTimeInThePast(new Date(comment.createdAt))}
            </Typography>
            {comment.createdAt !== comment.updatedAt && !comment.deletedAt && (
              <Typography variant='subtitle2'>(Edited)</Typography>
            )}
          </Stack>
          {(comment.createdBy === user?.id || permissions?.delete_comments) && !comment.deletedAt && (
            <IconButton
              className='comment-actions'
              size='small'
              data-test={`post-comment-menu-${comment.id}`}
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
        <Box data-test={`post-comment-charmeditor-${comment.id}`} ml={3}>
          {isEditingComment ? (
            <Stack>
              <CharmEditor
                colorMode='dark'
                style={{
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginLeft: 8,
                  minHeight: 100,
                  left: 0
                }}
                disableRowHandles
                focusOnInit
                placeholderText='What are your thoughts?'
                onContentChange={updateCommentContent}
                content={commentEditContent.doc}
              />
              <Stack flexDirection='row' my={1} ml={1} gap={1}>
                <Button data-test={`save-comment-${comment.id}`} size='small' onClick={saveCommentContent}>
                  Save
                </Button>
                <Button size='small' variant='outlined' color='secondary' onClick={cancelEditingComment}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          ) : comment.deletedAt ? (
            <Typography data-test={`deleted-comment-${comment.id}`} color='secondary' my={1}>
              Comment deleted{' '}
              {!comment.deletedBy ? '' : comment.deletedBy === comment.createdBy ? 'by user' : 'by moderator'}
            </Typography>
          ) : (
            <CharmEditor
              style={{
                paddingTop: 0,
                paddingBottom: 0,
                left: 0,
                paddingLeft: 0
              }}
              disableRowHandles
              readOnly
              key={isEditingComment.toString()}
              content={commentContent.doc}
            />
          )}
          {!comment.deletedAt && (
            <Stack flexDirection='row' gap={1}>
              <ForumVote permissions={permissions} votes={comment} onVote={voteComment} />
              <Typography
                sx={{
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (permissions?.add_comment) {
                    setShowCommentReply(true);
                  }
                }}
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
                postId={comment.postId}
              />
            )}
          </Box>
        </Box>
      </StyledStack>
      <Box ml={3} position='relative'>
        {comment.children.map((childComment) => (
          <PostComment
            permissions={permissions}
            setPostComments={setPostComments}
            comment={childComment}
            key={childComment.id}
            post={post}
          />
        ))}
      </Box>
      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title={!canDeleteComment ? "You cannot edit another user's comment" : ''}>
          <div>
            <MenuItem
              disabled={!canDeleteComment}
              data-test={`edit-comment-${comment.id}`}
              onClick={onClickEditComment}
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText>Edit comment</ListItemText>
            </MenuItem>
          </div>
        </Tooltip>

        {/**  This tooltip shouldn't ever be needed since only moderators and comment authors should be able see this context menu, but adding for future proofing */}
        <Tooltip title={!canDeleteComment ? "You don't have the permissions to delete this comment" : ''}>
          <div>
            <MenuItem
              disabled={!canDeleteComment}
              data-test={`delete-comment-${comment.id}`}
              onClick={onClickDeleteComment}
            >
              <ListItemIcon>
                <DeleteOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Delete comment</ListItemText>
            </MenuItem>
          </div>
        </Tooltip>
      </Menu>
    </Stack>
  );
}
