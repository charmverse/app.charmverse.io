import styled from '@emotion/styled';
import { Typography, Button, ListItem, IconButton, TextField, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@emotion/react';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { useInlineComment } from 'hooks/useInlineComment';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { useUser } from 'hooks/useUser';
import List from '@mui/material/List';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { bindMenu } from 'material-ui-popup-state';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { forwardRef, useState } from 'react';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ContextBorder = styled.div`
  width: 3px;
  border-radius: 3px;
  margin-left: 2px;
  margin-right: 8px;
  background: rgba(255, 212, 0, 0.8);
  flex-shrink: 0;
  padding-bottom: 2px;
`;

export default forwardRef<HTMLDivElement, {threadId: string, inline?: boolean}>(({ threadId, inline = true }, ref) => {
  const { threads, setThreads } = useThreads();
  const [user] = useUser();
  const thread = threadId && threads[threadId];
  const theme = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [editedComment, setEditedComment] = useState<null | string>(null);
  const [targetedComment, setTargetedComment] = useState<null | string>(null);
  const { removeInlineCommentMark } = useInlineComment();
  const { getPagePermissions, currentPageId } = usePages();
  const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();
  const popupState = usePopupState({ variant: 'popover', popupId: 'comment-actions' });
  const bindTriggerProps = bindTrigger(popupState);
  async function addComment () {
    if (thread && !isMutating) {
      try {
        setIsMutating(true);
        const comment = await charmClient.addComment({
          content: commentText,
          threadId: thread.id
        });

        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            Comment: [...thread.Comment, comment]
          } }));
      }
      catch (_) {
        //
      }
      setCommentText('');
      setIsMutating(false);
    }
  }

  async function editComment () {
    if (thread && editedComment && !isMutating) {
      try {
        setIsMutating(true);
        await charmClient.editComment(editedComment, commentText);
        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            Comment: thread.Comment.map(comment => comment.id === editedComment ? ({ ...comment, content: commentText }) : comment)
          } }));
      }
      catch (_) {
        //
      }
      setCommentText('');
      setEditedComment(null);
      setIsMutating(false);
      setTargetedComment(null);
    }
  }

  async function deleteComment () {
    if (thread) {
      const comment = thread.Comment.find(_comment => _comment.id === targetedComment);
      if (comment) {
        try {
          await charmClient.deleteComment(comment.id);
          const threadWithoutComment = {
            ...thread,
            Comment: thread.Comment.filter(_comment => _comment.id !== comment.id)
          };
          setThreads((_threads) => ({ ..._threads, [thread.id]: threadWithoutComment }));
        }
        catch (_) {
          //
        }
        popupState.close();
        setTargetedComment(null);
      }
    }
  }

  async function resolveThread () {
    if (thread) {
      setIsMutating(true);
      try {
        await charmClient.updateThread(thread.id, {
          resolved: !thread.resolved
        });
        setThreads((_threads) => ({ ..._threads,
          [thread.id]: {
            ...thread,
            resolved: !thread.resolved
          } }));
        removeInlineCommentMark(thread.id);
      }
      catch (_) {
        //
      }
      setIsMutating(false);
    }
  }

  async function deleteThread () {
    if (thread) {
      setIsMutating(true);
      try {
        await charmClient.deleteThread(thread.id);
        delete threads[thread.id];
        setThreads({ ...threads });
        removeInlineCommentMark(thread.id);
      }
      catch (_) {
        //
      }
      setIsMutating(false);
    }
  }

  return thread ? (
    <Box id={`thread.${threadId}`} ref={ref} p={2} sx={{ background: theme.palette.background.light, maxHeight: inline ? 300 : 'fit-content' }}>
      <Box maxHeight={inline ? 220 : 'fit-content'} pr={inline ? 1 : 0} overflow='auto'>
        <Box justifyContent='space-between' display='flex' alignItems='center' mb={1} gap={5}>
          <Typography color='secondary' variant='subtitle1' display='flex' flexDirection='row'>
            {new Date(thread.createdAt).toLocaleString()}
          </Typography>
          <Box display='flex' gap={1}>
            {/* Find button should not be present for inline thread  */ !inline && (
            <Button
              onClick={() => {
                const threadDocument = document.getElementById(`inline-comment.${threadId}`);
                if (threadDocument) {
                  threadDocument.scrollIntoView({
                    behavior: 'smooth'
                  });
                }
              }}
              sx={{
                '.MuiButton-startIcon': {
                  mr: 0.5
                }
              }}
              startIcon={(
                <LocationOnIcon
                  fontSize='small'
                />
          )}
              variant='outlined'
              color='secondary'
              size='small'
            >Find
            </Button>
            )}
            <Button
              disabled={isMutating || !permissions.edit_content || (thread.userId !== user?.id)}
              onClick={resolveThread}
              sx={{
                '.MuiButton-startIcon': {
                  mr: 0.5
                }
              }}
              startIcon={(
                <CheckIcon
                  fontSize='small'
                />
          )}
              variant='outlined'
              color='secondary'
              size='small'
            >{thread.resolved ? 'Un-resolve' : 'Resolve'}
            </Button>
            <Button
              onClick={deleteThread}
              disabled={isMutating || !permissions.edit_content || (thread.userId !== user?.id)}
              sx={{
                '.MuiButton-startIcon': {
                  mr: 0.25
                }
              }}
              startIcon={(
                <DeleteIcon
                  fontSize='small'
                />
            )}
              variant='outlined'
              color='secondary'
              size='small'
            >Delete
            </Button>
          </Box>
        </Box>
        {thread.Comment.map((comment, commentIndex) => {
          return (
            <List
              key={comment.id}
              sx={{
                '.comment-actions': {
                  opacity: 0
                },
                '&:hover .comment-actions': {
                  opacity: 1
                },
                p: 1,
                borderRadius: theme.spacing(0.5),
                background: targetedComment === comment.id ? 'rgba(46, 170, 220, 0.15)' : 'inherit'
              }}
            >
              <ListItem
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: 0
                }}
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
                  <IconButton
                    size='small'
                    {...bindTriggerProps}
                    onClick={(e) => {
                      setTargetedComment(comment.id);
                      bindTriggerProps.onClick(e);
                    }}
                    className='comment-actions'
                  >
                    <MoreHorizIcon color='secondary' fontSize='small' />
                  </IconButton>
                  )}
                </Box>
                {commentIndex === 0 && (
                <Box mb={1} pl={4} display='flex'>
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
                <Typography pl={4}>{comment.content}</Typography>
              </ListItem>
            </List>
          );
        })}
      </Box>
      {permissions.edit_content && (
      <Box display='flex' gap={1} mt={thread.Comment.length !== 0 ? 1 : 0}>
        <TextField
          InputProps={{
            className: 'PageThread-TextField-input'
          }}
          placeholder='Add a comment...'
          fullWidth
          size='small'
          onChange={(e) => setCommentText(e.target.value)}
          value={commentText}
        />
        <Button disabled={isMutating || commentText.length === 0} size='small' onClick={() => editedComment ? editComment() : addComment()}>{editedComment ? 'Edit' : 'Add'}</Button>
        {editedComment && (
        <Button
          onClick={() => {
            setCommentText('');
            setEditedComment(null);
            setTargetedComment(null);
          }}
          color='error'
          size='small'
        >Cancel
        </Button>
        )}
      </Box>
      )}
      {permissions.edit_content && (
      <Menu {...bindMenu(popupState)}>
        <MenuItem
          onClick={async () => {
            const comment = thread.Comment.find(_comment => _comment.id === targetedComment);
            if (comment) {
              setEditedComment(comment.id);
              setCommentText(comment.content);
              popupState.close();
            }
          }}
        >
          <EditIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={deleteComment}
        >
          <DeleteIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>
      )}
    </Box>
  ) : null;
});
