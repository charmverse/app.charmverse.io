import styled from '@emotion/styled';
import { Box, Menu, MenuItem, ListItemText, ListItemIcon, Paper, Typography, Button, ListItem, IconButton, ButtonProps, Tooltip } from '@mui/material';
import { useTheme } from '@emotion/react';
import type { CommentWithUser } from 'pages/api/pages/[id]/threads';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { forwardRef, MouseEvent, ReactNode, useState } from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { PageContent } from 'models';
import { highlightDomElement } from 'lib/dom/highlight';
import { removeInlineCommentMark } from 'lib/inline-comments/removeInlineCommentMark';
import { useEditorViewContext } from '@bangle.dev/react';
import { DateTime } from 'luxon';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { usePopupState, bindMenu } from 'material-ui-popup-state/hooks';
import InlineCharmEditor from '../InlineCharmEditor';
import { checkForEmpty } from '../utils';

const ContextBorder = styled.div`
  width: 3px;
  border-radius: 3px;
  margin-left: 2px;
  margin-right: 8px;
  background: rgba(255, 212, 0, 0.8);
  flex-shrink: 0;
  padding-bottom: 2px;
`;

const StyledPageThread = styled(Paper)<{ inline: boolean }>`
  overflow: ${({ inline }) => inline ? 'auto' : 'unset'};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.palette.background.light};
  width: ${({ inline }) => inline ? '500px' : 'inherit'};
  max-height: ${({ inline }) => inline ? '300px' : 'fit-content'};
`;

const ThreadHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)}
`;

const ThreadCommentListItem = styled(ListItem)<{ highlighted?: string }>`
  background: ${({ highlighted }) => highlighted === 'true' ? 'rgba(46, 170, 220, 0.15)' : 'inherit'};
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

function ThreadHeaderButton ({ disabled = false, onClick, text, startIcon }: {disabled?: boolean, onClick: ButtonProps['onClick'], startIcon: ReactNode, text: string}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={{
        '.MuiButton-startIcon': {
          mr: 0.5
        }
      }}
      startIcon={startIcon}
      variant='outlined'
      color='secondary'
      size='small'
    >{text}
    </Button>
  );
}

interface PageThreadProps {
  threadId: string;
  inline?: boolean;
  showFindButton?: boolean;
}

function scrollToThread (threadId: string) {
  // Find the inline-comment with the threadId and scroll into view
  const threadDocument = document.getElementById(`inline-comment.${threadId}`);
  if (threadDocument) {
    let parentElement: HTMLElement | null = null;
    let element: HTMLElement | null = threadDocument;
    // Check for highest 5 levels of depth
    for (let i = 0; i < 5; i++) {
      element = threadDocument.parentElement;
      // Get the first paragraph parent element
      if (element?.classList.contains('bangle-nv-content')) {
        parentElement = element;
        break;
      }
    }

    requestAnimationFrame(() => {
      threadDocument.scrollIntoView({
        behavior: 'smooth'
      });
    });

    setTimeout(() => {
      if (parentElement) {
        // Need to create a custom element as adding styling to prosemirror-node isn't possible
        const highlightElement = document.createElement('div');
        document.body.appendChild(highlightElement);
        const boundingRect = parentElement.getBoundingClientRect();
        // Set the location of the custom element
        highlightElement.style.top = `${boundingRect.top}px`;
        highlightElement.style.left = `${boundingRect.left}px`;
        highlightElement.style.width = `${boundingRect.width}px`;
        highlightElement.style.height = `${boundingRect.height}px`;
        highlightElement.style.position = 'absolute';
        highlightDomElement(highlightElement, () => {
          // Remove the custom element after the highlighting is done
          document.body.removeChild(highlightElement);
        });
      }
    }, 500);
  }
}

const PageThread = forwardRef<HTMLDivElement, PageThreadProps>(({ showFindButton = false, threadId, inline = false }, ref) => {
  showFindButton = showFindButton ?? (!inline);
  const { deleteThread, resolveThread, deleteComment, editComment, addComment, threads } = useThreads();
  const [user] = useUser();
  const theme = useTheme();
  const [commentContent, setCommentContent] = useState<PageContent | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [editedCommentId, setEditedCommentId] = useState<null | string>(null);
  const { getPagePermissions, currentPageId } = usePages();
  const menuState = usePopupState({ variant: 'popover', popupId: 'comment-action' });
  const [actionComment, setActionComment] = useState<null | CommentWithUser>(null);

  const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();
  const view = useEditorViewContext();
  const isEmpty = checkForEmpty(commentContent);
  const thread = threadId ? threads[threadId] : null;

  function resetState () {
    setEditedCommentId(null);
    setIsMutating(false);
    setCommentContent(null);
  }

  function onClickCommentActions (event: MouseEvent<HTMLButtonElement, MouseEvent>, comment: CommentWithUser) {
    setActionComment(comment);
    menuState.open(event.currentTarget);
  }

  function onClickEditComment () {
    if (actionComment) {
      setEditedCommentId(actionComment.id);
      setCommentContent(actionComment.content as PageContent);
    }
    menuState.close();
  }

  async function onClickDeleteComment () {
    if (actionComment && thread) {
      // If we delete the last comment, delete the whole thread
      if (thread.comments.length === 1) {
        setIsMutating(true);
        await deleteThread(threadId);
        removeInlineCommentMark(view, thread.id, true);
        setIsMutating(false);
      }
      else {
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

  if (!thread) {
    return null;
  }

  return (
    <StyledPageThread inline={inline} id={`thread.${threadId}`} ref={ref}>
      <div>
        <ThreadHeader>
          <Tooltip arrow placement='bottom' title={new Date(thread.createdAt).toLocaleString()}>
            <Typography
              sx={{
                cursor: 'pointer'
              }}
              color='secondary'
              variant='subtitle1'
              display='flex'
              flexDirection='row'
            >
              {DateTime.fromJSDate(new Date(thread.createdAt)).toRelative({ base: (DateTime.now()) })}
            </Typography>
          </Tooltip>
          <Box display='flex' gap={1}>
            <ThreadHeaderButton
              text={thread.resolved ? 'Un-resolve' : 'Resolve'}
              startIcon={(
                <CheckIcon
                  fontSize='small'
                />
            )}
              disabled={isMutating || !permissions.edit_content || (thread.userId !== user?.id)}
              onClick={async () => {
                setIsMutating(true);
                await resolveThread(threadId);
                removeInlineCommentMark(view, thread.id);
                setIsMutating(false);
              }}
            />
          </Box>
        </ThreadHeader>
        {thread.comments.map((comment, commentIndex) => {
          return (
            <ThreadCommentListItem
              key={comment.id}
              onClick={() => {
                if (showFindButton) {
                  scrollToThread(threadId);
                }
              }}
              highlighted={(editedCommentId === comment.id).toString()}
            >
              <Box display='flex' width='100%' justifyContent='space-between'>
                <Box display='flex' gap={1}>
                  <ReviewerOption component='div' user={comment.user} avatarSize='small' />
                  <Typography
                    sx={{
                      cursor: 'pointer'
                    }}
                    color='secondary'
                    variant='subtitle1'
                    display='flex'
                    flexDirection='row'
                  >
                    <Tooltip arrow placement='bottom' title={new Date(comment.createdAt).toLocaleString()}>
                      <span>
                        {DateTime.fromJSDate(new Date(comment.createdAt)).toRelative({ base: (DateTime.now()) })}
                      </span>
                    </Tooltip>
                    {comment.updatedAt && (
                    <Tooltip arrow placement='bottom' title={new Date(comment.updatedAt).toLocaleString()}>
                      <span style={{ marginLeft: '4px' }}>
                        (edited)
                      </span>
                    </Tooltip>
                    )}
                  </Typography>
                </Box>
                {(comment.userId === user?.id && permissions.edit_content)
                  && (
                    <IconButton
                      className='comment-actions'
                      size='small'
                      onClick={(e: any) => {
                        e.stopPropagation();
                        onClickCommentActions(e, comment);
                      }}
                    >
                      <MoreHorizIcon fontSize='small' />
                    </IconButton>
                  )}
              </Box>
              {commentIndex === 0 && (
              <Box pl={4} display='flex'>
                <ContextBorder />
                <Typography
                  sx={{
                    wordBreak: 'break-all',
                    textAlign: 'justify'
                  }}
                  fontWeight={600}
                  color='secondary'
                >
                  {thread.context}
                </Typography>
              </Box>
              )}
              <Box display='flex' width='100%' justifyContent='space-between'>
                <InlineCharmEditor
                  readOnly
                  key={JSON.stringify(comment.content)}
                  content={comment.content as PageContent}
                  style={{
                    paddingLeft: theme.spacing(4)
                  }}
                />
              </Box>
            </ThreadCommentListItem>
          );
        })}
        <Menu
          {...bindMenu(menuState)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={onClickEditComment}>
            <ListItemIcon><EditIcon /></ListItemIcon>
            <ListItemText>Edit comment</ListItemText>
          </MenuItem>
          <MenuItem onClick={onClickDeleteComment}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Delete comment</ListItemText>
          </MenuItem>
        </Menu>
      </div>
      {permissions.edit_content && (
      <Box display='flex' flexDirection='column' gap={1} mt={thread.comments.length !== 0 ? 1 : 0}>
        <InlineCharmEditor
          style={{
            backgroundColor: theme.palette.background.default,
            padding: theme.spacing(0, 1)
          }}
          key={`${editedCommentId}.${thread.comments[thread.comments.length - 1]?.id}`}
          content={commentContent}
          onContentChange={({ doc }) => {
            setCommentContent(doc);
          }}
        />
        <Box display='flex' gap={1}>
          <Button
            disabled={isMutating || isEmpty}
            size='small'
            onClick={() => {
              setIsMutating(true);
              if (editedCommentId && commentContent) {
                editComment(threadId, editedCommentId, commentContent);
              }
              else if (commentContent) {
                addComment(threadId, commentContent);
              }
              resetState();
            }}
          >
            {editedCommentId ? 'Save' : 'Add'}
          </Button>
          {editedCommentId && (
          <Button
            onClick={resetState}
            variant='outlined'
            color='secondary'
            size='small'
          >
            Cancel
          </Button>
          )}
        </Box>
      </Box>
      )}
    </StyledPageThread>
  );
});

export default PageThread;
