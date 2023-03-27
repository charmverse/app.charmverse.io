import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Check } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import type { BoxProps, ButtonProps, SxProps, Theme } from '@mui/material';
import {
  Box,
  Collapse,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { DateTime } from 'luxon';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent } from 'react';
import { forwardRef, memo, useEffect, useRef, useState } from 'react';

import Button from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePreventReload } from 'hooks/usePreventReload';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import type { CommentWithUser } from 'lib/comments/interfaces';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { removeInlineCommentMark } from 'lib/prosemirror/plugins/inlineComments/removeInlineCommentMark';
import type { ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';

import InlineCharmEditor from '../InlineCharmEditor';

import { scrollToThread } from './inlineComment/inlineComment.utils';

const ContextBorder = styled.div`
  width: 3px;
  border-radius: 3px;
  margin-left: 2px;
  margin-right: 8px;
  background: rgba(255, 212, 0, 0.8);
  flex-shrink: 0;
  padding-bottom: 2px;
`;

const StyledPageThread = styled(Paper)<{ inline: string }>`
  overflow: ${({ inline }) => (inline === 'true' ? 'auto' : 'unset')};
  padding: ${({ theme, inline }) => theme.spacing(inline === 'true' ? 2 : 1)};
  width: ${({ inline }) => (inline === 'true' ? '100%' : 'inherit')};
  max-height: ${({ inline }) => (inline === 'true' ? 'initial' : 'fit-content')};
`;

const ThreadCommentListItem = styled(ListItem)<{ highlighted?: string }>`
  background: ${({ highlighted }) => (highlighted === 'true' ? 'rgba(46, 170, 220, 0.15)' : 'inherit')};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  & .ProseMirror.bangle-editor {
    padding: 0px;
  }

  &:hover .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 1;
  }

  & .comment-actions {
    transition: opacity 150ms ease-in-out;
    opacity: 0;
  }
`;

function ThreadHeaderButton({
  disabled = false,
  text,
  onClick,
  startIcon,
  ...props
}: { disabled?: boolean; onClick: ButtonProps['onClick']; text: string } & ButtonProps) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      startIcon={startIcon}
      variant='outlined'
      color='secondary'
      size='small'
      {...props}
      sx={{ minWidth: ['unset', '64px'], px: [0.5, '10px'] }}
    >
      {text}
    </Button>
  );
}

function AddCommentCharmEditor({
  sx,
  threadId,
  disabled,
  onClick,
  readOnly
}: {
  onClick: (cb: () => void) => void;
  readOnly: boolean;
  disabled: boolean;
  threadId: string;
  sx: SxProps<Theme>;
}) {
  const [commentContent, setCommentContent] = useState<PageContent | null>(null);
  const isEmpty = checkIsContentEmpty(commentContent);
  const { addComment, threads } = useThreads();
  const thread = threads[threadId] as ThreadWithCommentsAndAuthors;
  const touched = useRef(false);

  usePreventReload(touched.current);

  return (
    <Box display='flex' px={1} pb={1} sx={sx} flexDirection='column' gap={1} mt={thread.comments.length !== 0 ? 1 : 0}>
      <InlineCharmEditor
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)'
        }}
        placeholderText='Reply...'
        key={thread.comments[thread.comments.length - 1]?.id}
        content={commentContent}
        onContentChange={({ doc }) => {
          setCommentContent(doc);
          touched.current = true;
        }}
        readOnly={readOnly || disabled}
      />
      <Box display='flex' gap={1} justifyContent='flex-end'>
        <Button
          disabled={disabled || isEmpty}
          size='small'
          onClick={() => {
            onClick(() => {
              if (commentContent) {
                addComment(threadId, commentContent);
              }
            });
          }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
}

function EditCommentCharmEditor({
  disabled,
  isEditable,
  threadId,
  commentId,
  onContainerClick,
  onSave,
  onCancel
}: {
  disabled: boolean;
  isEditable: boolean;
  onCancel: ButtonProps['onClick'];
  threadId: string;
  commentId: string;
  onContainerClick: BoxProps['onClick'];
  onSave: (cb: () => Promise<void>) => void;
}) {
  const [commentContent, setCommentContent] = useState<PageContent | null>(null);
  const isEmpty = checkIsContentEmpty(commentContent);
  const { editComment, threads } = useThreads();
  const thread = threads[threadId] as ThreadWithCommentsAndAuthors;
  const comment = thread.comments.find((_comment) => _comment.id === commentId) as CommentWithUser;

  return (
    <>
      <Box onClick={onContainerClick} flex={1} width='100%'>
        <Box sx={{ marginLeft: `${32 - 4}px`, paddingLeft: '4px', bgcolor: isEditable ? 'background.default' : '' }}>
          <InlineCharmEditor
            readOnly={!isEditable}
            key={comment.id + isEditable}
            content={comment.content as PageContent}
            onContentChange={({ doc }) => {
              setCommentContent(doc);
            }}
            noPadding={true}
            style={{
              fontSize: 14,
              width: '100%'
            }}
          />
        </Box>
      </Box>
      <Collapse
        sx={{
          pl: 4
        }}
        in={isEditable}
      >
        <Box display='flex' gap={1} pt={1}>
          <Button
            disabled={disabled || isEmpty}
            size='small'
            onClick={async () => {
              onSave(async () => {
                if (commentContent) {
                  await editComment(threadId, comment.id, commentContent);
                }
              });
            }}
          >
            Save
          </Button>
          <Button onClick={onCancel} variant='outlined' color='secondary' size='small'>
            Cancel
          </Button>
        </Box>
      </Collapse>
    </>
  );
}

interface PageThreadProps {
  threadId: string;
  inline?: boolean;
  showFindButton?: boolean;
}

export const RelativeDate = memo<{ createdAt: string | Date; prefix?: string; updatedAt?: string | Date | null }>(
  ({ createdAt, updatedAt }) => {
    const getDateTime = () => DateTime.fromISO(createdAt.toString());
    const { formatDateTime } = useDateFormatter();

    const [dateTime, setTime] = useState(getDateTime());

    // update once a minute
    useEffect(() => {
      const interval = setInterval(() => setTime(getDateTime()), 60 * 1000);
      return () => {
        clearInterval(interval);
      };
    }, []);

    return (
      <Typography
        sx={{
          cursor: 'default',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center'
        }}
        color='secondary'
        variant='subtitle1'
      >
        <Tooltip arrow placement='top' title={formatDateTime(createdAt)}>
          <span>{dateTime.toRelative({ style: 'short' })}</span>
        </Tooltip>
        {updatedAt && (
          <Tooltip arrow placement='top' title={formatDateTime(updatedAt)}>
            <span style={{ marginLeft: '4px' }}>(edited)</span>
          </Tooltip>
        )}
      </Typography>
    );
  }
);

const PageThread = forwardRef<HTMLDivElement, PageThreadProps>(
  ({ showFindButton = false, threadId, inline = false }, ref) => {
    showFindButton = showFindButton ?? !inline;
    const { deleteThread, resolveThread, deleteComment, threads } = useThreads();
    const { user } = useUser();
    const [isMutating, setIsMutating] = useState(false);
    const [editedCommentId, setEditedCommentId] = useState<null | string>(null);
    const { currentPageId } = useCurrentPage();
    const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });
    const [actionComment, setActionComment] = useState<null | CommentWithUser>(null);

    const { permissions } = usePagePermissions({ pageIdOrPath: currentPageId });
    const view = useEditorViewContext();
    const thread = threadId ? (threads[threadId] as ThreadWithCommentsAndAuthors) : null;
    const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    function resetState() {
      setEditedCommentId(null);
      setIsMutating(false);
    }

    function onClickCommentActions(event: MouseEvent<HTMLButtonElement, MouseEvent>, comment: CommentWithUser) {
      setActionComment(comment);
      menuState.open(event.currentTarget);
    }

    function onClickEditComment() {
      if (actionComment) {
        setEditedCommentId(actionComment.id);
      }
      menuState.close();
    }

    async function onClickDeleteComment() {
      if (actionComment && thread) {
        // If we delete the last comment, delete the whole thread
        if (thread.comments.length === 1) {
          setIsMutating(true);
          await deleteThread(threadId);
          removeInlineCommentMark(view, thread.id, true);
          setIsMutating(false);
        } else {
          setIsMutating(true);
          deleteComment(threadId, actionComment.id);
          if (editedCommentId === actionComment.id) {
            resetState();
          }
          setIsMutating(false);
        }
      }
      menuState.close();
    }

    async function toggleResolved() {
      setIsMutating(true);
      await resolveThread(threadId);
      removeInlineCommentMark(view, threadId);
      setIsMutating(false);
    }

    if (!thread) {
      return null;
    }

    return (
      <StyledPageThread inline={inline.toString()} variant='outlined' id={`thread.${threadId}`} ref={ref}>
        <div>
          {thread.comments.map((comment, commentIndex) => {
            const isEditable = comment.id === editedCommentId;
            return (
              <ThreadCommentListItem
                key={comment.id}
                highlighted={(editedCommentId === comment.id).toString()}
                id={`comment.${comment.id}`}
              >
                <Box display='flex' width='100%' alignItems='center' justifyContent='space-between'>
                  <Box
                    display='flex'
                    gap={1}
                    onClick={() => {
                      if (showFindButton) {
                        scrollToThread(threadId);
                      }
                    }}
                  >
                    <UserDisplay
                      showMiniProfile
                      component='div'
                      user={comment.user}
                      avatarSize='small'
                      sx={{
                        '& .MuiTypography-root': {
                          maxWidth: commentIndex === 0 && thread.resolved ? 100 : 150,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }
                      }}
                      fontSize={14}
                      fontWeight={500}
                    />
                    <RelativeDate createdAt={comment.createdAt.toString()} updatedAt={comment.updatedAt?.toString()} />
                  </Box>
                  <div>
                    <Box display='flex' alignItems='center' gap={1}>
                      {commentIndex === 0 && !isSmallScreen && (
                        <ThreadHeaderButton
                          text={thread.resolved ? 'Un-resolve' : 'Resolve'}
                          disabled={isMutating || !permissions?.comment}
                          onClick={toggleResolved}
                        />
                      )}

                      {comment.userId === user?.id && (
                        <IconButton
                          // Show the context menu next to resolve
                          className={commentIndex === 0 ? '' : 'comment-actions'}
                          size='small'
                          onClick={(e: any) => {
                            onClickCommentActions(e, comment);
                          }}
                        >
                          <MoreHorizIcon fontSize='small' />
                        </IconButton>
                      )}
                    </Box>
                  </div>
                </Box>
                {commentIndex === 0 && (
                  <Box
                    pl={4}
                    pb={1}
                    display='flex'
                    onClick={() => {
                      if (showFindButton) {
                        scrollToThread(threadId);
                      }
                    }}
                  >
                    <ContextBorder />
                    <Typography
                      sx={{
                        wordBreak: 'break-all',
                        textAlign: 'justify'
                      }}
                      fontSize={14}
                      fontWeight={600}
                      color='secondary'
                    >
                      {thread.context}
                    </Typography>
                  </Box>
                )}

                <EditCommentCharmEditor
                  commentId={comment.id}
                  disabled={isMutating}
                  isEditable={isEditable}
                  onCancel={resetState}
                  onContainerClick={() => {
                    // Shouldn't scroll if we are in comment edit mode
                    if (showFindButton && !isEditable) {
                      scrollToThread(threadId);
                    }
                  }}
                  onSave={async (cb) => {
                    setIsMutating(true);
                    await cb();
                    resetState();
                  }}
                  threadId={thread.id}
                />
              </ThreadCommentListItem>
            );
          })}
          <Menu
            {...bindMenu(menuState)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            onClick={(e) => e.stopPropagation()}
          >
            {isSmallScreen && (
              <MenuItem onClick={onClickEditComment}>
                <ListItemIcon>{thread.resolved ? <SettingsBackupRestoreIcon /> : <Check />}</ListItemIcon>
                <ListItemText>{thread.resolved ? 'Un-resolve' : 'Resolve'}</ListItemText>
              </MenuItem>
            )}
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
        </div>
        {permissions?.comment && (
          <AddCommentCharmEditor
            key={thread.comments[thread.comments.length - 1]?.id}
            readOnly={Boolean(editedCommentId)}
            sx={{
              display: 'flex',
              px: 1,
              pb: 1,
              flexDirection: 'column',
              gap: 1,
              mt: thread.comments.length !== 0 ? 1 : 0
            }}
            disabled={!!editedCommentId || isMutating}
            threadId={thread.id}
            onClick={(cb) => {
              if (editedCommentId) {
                return;
              }
              setIsMutating(true);
              cb();
              resetState();
            }}
          />
        )}
      </StyledPageThread>
    );
  }
);

export default PageThread;
