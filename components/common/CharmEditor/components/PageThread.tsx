import styled from '@emotion/styled';
import { Typography, Button, ListItem, IconButton, ButtonProps } from '@mui/material';
import { useTheme } from '@emotion/react';
import { Box } from '@mui/system';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { forwardRef, ReactNode, useState } from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PageContent } from 'models';
import { useInlineComment } from 'hooks/useInlineComment';
import { highlightDomElement } from 'lib/dom/highlight';
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

const defaultCharmEditorContent = () => {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  };
};

const StyledThreadBox = styled(Box)<{inline: boolean}>`
  overflow: ${({ inline }) => inline ? 'auto' : 'unset'};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.palette.background.light};
  width: ${({ inline }) => inline ? '500px' : 'inherit'};
  max-height: ${({ inline }) => inline ? '300px' : 'fit-content'};
`;

const ThreadHeaderBox = styled(Box)`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)}
`;

const ThreadCommentListItem = styled(ListItem)<{highlighted?: string}>`
  background: ${({ highlighted }) => highlighted === 'true' ? 'rgba(46, 170, 220, 0.15)' : 'inherit'};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-left: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  & .ProseMirror.bangle-editor {
    padding: 0px;
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

export default forwardRef<HTMLDivElement,
  {threadId: string, inline?: boolean, showFindButton?: boolean}>(({ showFindButton = false, threadId, inline = true }, ref) => {
    showFindButton = showFindButton ?? (!inline);
    const { deleteThread, resolveThread, deleteComment, editComment, addComment, threads } = useThreads();
    const [user] = useUser();
    const theme = useTheme();
    const [commentContent, setCommentContent] = useState<PageContent>(defaultCharmEditorContent());
    const [isMutating, setIsMutating] = useState(false);
    const [editedComment, setEditedComment] = useState<null | string>(null);
    const { getPagePermissions, currentPageId } = usePages();
    const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();
    const { removeInlineCommentMark } = useInlineComment();

    function resetState () {
      setEditedComment(null);
      setIsMutating(false);
      setCommentContent(defaultCharmEditorContent());
    }

    const isEmpty = checkForEmpty(commentContent);
    const thread = threadId ? threads[threadId] : null;

    return thread ? (
      <StyledThreadBox inline={inline} id={`thread.${threadId}`} ref={ref}>
        <div>
          <ThreadHeaderBox>
            <Typography color='secondary' variant='subtitle1' display='flex' flexDirection='row'>
              {new Date(thread.createdAt).toLocaleString()}
            </Typography>
            <Box display='flex' gap={1}>
              {/* Find button should not be present for inline thread  */ showFindButton && (
              <ThreadHeaderButton
                onClick={() => {
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
                }}
                startIcon={(
                  <LocationOnIcon
                    fontSize='small'
                  />
              )}
                text='Find'
              />
              )}
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
                  removeInlineCommentMark(thread.id);
                  setIsMutating(false);
                }}
              />
              <ThreadHeaderButton
                startIcon={(
                  <DeleteIcon
                    fontSize='small'
                  />
            )}
                text='Delete'
                onClick={async () => {
                  setIsMutating(true);
                  await deleteThread(threadId);
                  removeInlineCommentMark(thread.id, true);
                  setIsMutating(false);
                }}
                disabled={isMutating || !permissions.edit_content || (thread.userId !== user?.id)}
              />
            </Box>
          </ThreadHeaderBox>
          {thread.Comment.map((comment, commentIndex) => {
            return (
              <ThreadCommentListItem
                key={comment.id}
                highlighted={(editedComment === comment.id).toString()}
              >
                <Box display='flex' width='100%' justifyContent='space-between'>
                  <Box sx={{
                    display: 'flex',
                    gap: 1
                  }}
                  >
                    <ReviewerOption component='div' user={comment.user as any} avatarSize='small' />
                    <Typography color='secondary' variant='subtitle1' display='flex' flexDirection='row'>
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  {(comment.userId === user?.id) && permissions.edit_content && (
                  <Box display='flex'>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setEditedComment(comment.id);
                        setCommentContent(comment.content as PageContent);
                      }}
                    >
                      <EditIcon fontSize='small' color='primary' />
                    </IconButton>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setIsMutating(true);
                        deleteComment(threadId, comment.id);
                        if (editedComment === comment.id) {
                          resetState();
                        }
                        setIsMutating(false);
                      }}
                    >
                      <DeleteIcon fontSize='small' color='error' />
                    </IconButton>
                  </Box>
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
                  >{thread.context}
                  </Typography>
                </Box>
                )}
                <InlineCharmEditor
                  readOnly
                  key={JSON.stringify(comment.content)}
                  content={comment.content as PageContent}
                  style={{
                    paddingLeft: theme.spacing(4)
                  }}
                />
              </ThreadCommentListItem>
            );
          })}
        </div>
        {permissions.edit_content && (
        <Box display='flex' flexDirection='column' gap={1} mt={thread.Comment.length !== 0 ? 1 : 0}>
          <InlineCharmEditor
            style={{
              backgroundColor: theme.palette.background.default,
              padding: theme.spacing(0, 1)
            }}
            key={`${editedComment}.${thread.Comment[thread.Comment.length - 1]?.id}`}
            content={commentContent}
            onContentChange={({ doc }) => {
              setCommentContent(doc);
            }}
          />
          <div>
            <Button
              sx={{
                mr: 1
              }}
              disabled={isMutating || isEmpty}
              size='small'
              onClick={() => {
                setIsMutating(true);
                if (editedComment) {
                  editComment(threadId, editedComment, commentContent);
                }
                else {
                  addComment(threadId, commentContent);
                }
                resetState();
              }}
            >{editedComment ? 'Edit' : 'Add'}
            </Button>
            {editedComment && (
            <Button
              onClick={resetState}
              color='error'
              size='small'
            >Cancel
            </Button>
            )}
          </div>
        </Box>
        )}
      </StyledThreadBox>
    ) : null;
  });
