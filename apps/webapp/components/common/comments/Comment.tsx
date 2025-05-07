import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { isProdEnv } from '@packages/config/constants';
import type { CommentPermissions, CommentWithChildren, GenericCommentWithVote } from '@packages/lib/comments';
import { getRelativeTimeInThePast } from '@packages/lib/utils/dates';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from 'components/common/Button';
import { CharmEditor, InlineCharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import { CommentReply } from 'components/common/comments/CommentReply';
import { CommentVote } from 'components/common/comments/CommentVote';
import type { CreateCommentPayload, UpdateCommentPayload } from 'components/common/comments/interfaces';
import UserDisplay from 'components/common/UserDisplay';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

import Link from '../Link';

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

export type CommentProps = {
  replyingDisabled?: boolean;
  comment: CommentWithChildren;
  permissions?: CommentPermissions;
  deletingDisabled?: boolean;
  handleUpdateComment: (comment: UpdateCommentPayload) => Promise<void>;
  handleCreateComment: (comment: CreateCommentPayload) => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  handleVoteComment?: (vote: { commentId: string; upvoted: boolean | null }) => Promise<void>;
  inlineCharmEditor?: boolean;
  lensPostLink?: string | null;
  isPublishingComments?: boolean;
};

export function Comment({
  inlineCharmEditor,
  deletingDisabled,
  replyingDisabled = false,
  comment,
  permissions,
  handleCreateComment,
  handleUpdateComment,
  handleDeleteComment,
  handleVoteComment,
  lensPostLink,
  isPublishingComments
}: CommentProps) {
  const { user } = useUser();
  const router = useRouter();
  const { updateURLQuery } = useCharmRouter();
  const [showCommentReply, setShowCommentReply] = useState(false);
  const theme = useTheme();
  const { getMemberById } = useMembers();
  const commentUser = getMemberById(comment.createdBy);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentContent, setCommentContent] = useState<ICharmEditorOutput>({
    doc: comment.content as PageContent,
    rawText: comment.contentText
  });
  const commentContainerRef = useRef<HTMLDivElement | null>(null);
  const [commentEditContent, setCommentEditContent] = useState<ICharmEditorOutput>(commentContent);
  const { showUserProfile } = useMemberProfileDialog();
  const { commentId } = router.query as { commentId: string | null };
  async function saveCommentContent() {
    await handleUpdateComment({
      id: comment.id,
      content: commentEditContent.doc,
      contentText: commentEditContent.rawText
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

  async function voteComment(newUpvotedStatus: boolean | null) {
    if (handleVoteComment) {
      await handleVoteComment({
        commentId: comment.id,
        upvoted: newUpvotedStatus
      });
    }
  }

  function onClickEditComment() {
    setIsEditingComment(true);
    menuState.close();
  }

  async function onClickDeleteComment() {
    menuState.close();
    await handleDeleteComment(comment.id);
  }

  useEffect(() => {
    setTimeout(() => {
      if (commentId && commentId === comment.id && commentContainerRef.current) {
        commentContainerRef.current.scrollIntoView({
          behavior: 'smooth'
        });
        updateURLQuery({ commentId: null });
      }
    }, 1500);
  }, [commentId, updateURLQuery, commentContainerRef, comment.id]);

  const isCommentAuthor = comment.createdBy === user?.id;
  const canEditComment = isCommentAuthor;
  const canDeleteComment = (permissions?.delete_comments || isCommentAuthor) && !deletingDisabled;

  const editor = useMemo(() => {
    const editorCommentProps = {
      colorMode: 'dark' as const,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        marginLeft: 8,
        minHeight: 100,
        left: 0
      },
      disableRowHandles: true,
      focusOnInit: true,
      placeholderText: 'What are your thoughts?',
      onContentChange: updateCommentContent,
      content: commentEditContent.doc,
      isContentControlled: true,
      disableNestedPages: true
    };

    if (!inlineCharmEditor) {
      return <CharmEditor {...editorCommentProps} />;
    }

    return <InlineCharmEditor {...editorCommentProps} />;
  }, [inlineCharmEditor, commentEditContent, updateCommentContent]);

  return (
    <Stack my={1} position='relative' ref={commentContainerRef}>
      {/** test marker is here to avoid accidentally loading comments from recursive post comment components */}
      <StyledStack id={`comment-${comment.id}`} data-test={`comment-${comment.id}`}>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Stack flexDirection='row' alignItems='center'>
            <Box mr={1}>
              <UserDisplay showMiniProfile avatarSize='small' userId={commentUser?.id} hideName={true} />
            </Box>
            <Typography
              mr={1}
              onClick={() => {
                if (commentUser) {
                  showUserProfile(commentUser.id);
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
              data-test={`comment-menu-${comment.id}`}
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
        <Box data-test={`comment-charmeditor-${comment.id}`} ml={3}>
          {isEditingComment ? (
            <Stack>
              {editor}
              <Stack flexDirection='row' my={1} ml={1} gap={1}>
                <Button
                  data-test={`save-comment-${comment.id}`}
                  size='small'
                  onClick={saveCommentContent}
                  disabled={!commentEditContent.rawText}
                >
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
              isContentControlled
              disableNestedPages
            />
          )}
          {!comment.deletedAt && !replyingDisabled && (
            <Stack flexDirection='row' alignItems='center' gap={1}>
              {handleVoteComment && (
                <CommentVote permissions={permissions} votes={comment as GenericCommentWithVote} onVote={voteComment} />
              )}
              <Tooltip title={!permissions?.add_comment ? 'You do not have permissions to add a comment' : ''}>
                <Button
                  sx={{
                    padding: '2px 6px'
                  }}
                  onClick={() => {
                    if (permissions?.add_comment) {
                      setShowCommentReply(true);
                    }
                  }}
                >
                  Reply
                </Button>
              </Tooltip>
              {comment.lensCommentLink && (
                <Link
                  href={`https://${!isProdEnv ? 'testnet.' : ''}hey.xyz/posts/${comment.lensCommentLink}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Typography variant='body2' color='primary'>
                    View on lens
                  </Typography>
                </Link>
              )}
            </Stack>
          )}
          <Box mt={2}>
            {showCommentReply && (
              <CommentReply
                commentId={comment.id}
                handleCreateComment={handleCreateComment}
                onCancelComment={() => setShowCommentReply(false)}
              />
            )}
          </Box>
        </Box>
      </StyledStack>
      <Box ml={3} position='relative'>
        {comment.children.map((childComment) => (
          <Comment
            permissions={permissions}
            comment={childComment}
            key={childComment.id}
            deletingDisabled={deletingDisabled}
            handleDeleteComment={handleDeleteComment}
            handleVoteComment={handleVoteComment}
            handleUpdateComment={handleUpdateComment}
            handleCreateComment={handleCreateComment}
            lensPostLink={lensPostLink}
          />
        ))}
      </Box>
      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title={!canEditComment ? "You cannot edit another user's comment" : ''}>
          <div>
            <MenuItem disabled={!canEditComment} data-test={`edit-comment-${comment.id}`} onClick={onClickEditComment}>
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
