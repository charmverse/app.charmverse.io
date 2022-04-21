import { RawPlugins, RawSpecs, Plugin } from '@bangle.dev/core';
import { Schema, DOMOutputSpec, Command, toggleMark, EditorState, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';
import { useTheme } from '@emotion/react';
import { Box, Button, ClickAwayListener, IconButton, ListItem, Menu, MenuItem, TextField, Typography } from '@mui/material';
import List from '@mui/material/List';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { useState } from 'react';
import styled from '@emotion/styled';
import charmClient from 'charmClient';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useInlineComment } from 'hooks/useInlineComment';
import { hideSuggestionsTooltip, renderSuggestionsTooltip, SuggestTooltipPluginKey, SuggestTooltipPluginState } from './@bangle.dev/tooltip/suggest-tooltip';

const name = 'inline-comment';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

export function highlightSpec (): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      attrs: {
        id: {
          default: null
        }
      },
      parseDOM: [
        {
          tag: 'span.charm-inline-comment'
        }
      ],
      toDOM: (): DOMOutputSpec => ['span', { class: 'charm-inline-comment' }]
    },
    markdown: {
      // TODO: Fix convert to markdown
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true
      },
      parseMarkdown: {
        strong: { mark: name }
      }
    }
  };
}

export const InlineCommentPluginKey = new PluginKey('inlineCommentPluginKey');
export function inlineCommentPlugin (): RawPlugins {
  return [
    new Plugin({
      props: {
        handleClickOn: (view) => {
          const { $from } = view.state.selection;
          const node = $from.nodeAfter;
          if (node) {
            const inlineCommentMark = view.state.doc.type.schema.marks['inline-comment'].isInSet(node.marks);
            if (inlineCommentMark && inlineCommentMark.attrs.id) {
              renderSuggestionsTooltip(SuggestTooltipPluginKey, {
                component: 'inlineComment',
                threadId: inlineCommentMark.attrs.id
              })(view.state, view.dispatch, view);
            }
          }
          return true;
        }
      }
    })
  ];
}

const ContextBorder = styled.div`
  width: 3px;
  height: 22px;
  border-radius: 3px;
  margin-left: 2px;
  margin-right: 8px;
  background: rgba(255, 212, 0, 0.8);
  flex-shrink: 0;
  padding-bottom: 2px;
`;

export function InlineCommentThread () {
  const { threads, setThreads } = useThreads();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    component,
    threadId
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;

  const thread = threadId && threads[threadId];
  const theme = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [editedComment, setEditedComment] = useState<null | string>(null);
  const [targetedComment, setTargetedComment] = useState<null | string>(null);
  const { removeInlineCommentMark } = useInlineComment();

  async function addComment () {
    if (thread && !isMutating) {
      setIsMutating(true);
      const comment = await charmClient.addComment({
        content: commentText,
        threadId: thread.id
      });

      setCommentText('');
      setThreads((_threads) => ({ ..._threads,
        [thread.id]: {
          ...thread,
          Comment: [...thread.Comment, comment]
        } }));
      setIsMutating(false);
    }
  }

  async function editComment () {
    if (thread && editedComment && !isMutating) {
      setIsMutating(true);
      await charmClient.editComment(editedComment, commentText);
      setThreads((_threads) => ({ ..._threads,
        [thread.id]: {
          ...thread,
          Comment: thread.Comment.map(comment => comment.id === editedComment ? ({ ...comment, content: commentText }) : comment)
        } }));
      setCommentText('');
      setEditedComment(null);
      setIsMutating(false);
      setTargetedComment(null);
    }
  }

  async function resolveThread () {
    if (thread) {
      setIsMutating(true);
      await charmClient.updateThread(thread.id, {
        resolved: true
      });
      setThreads((_threads) => ({ ..._threads,
        [thread.id]: {
          ...thread,
          resolved: true
        } }));
      removeInlineCommentMark();
      setIsMutating(false);
    }
  }

  async function deleteThread () {
    if (thread) {
      setIsMutating(true);
      await charmClient.deleteThread(thread.id);
      delete threads[thread.id];
      setThreads(threads);
      removeInlineCommentMark();
      setIsMutating(false);
    }
  }

  const popupState = usePopupState({ variant: 'popover', popupId: 'comment-actions' });
  const bindTriggerProps = bindTrigger(popupState);
  if (isVisible && component === 'inlineComment' && thread && !thread.resolved) {
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
        setCommentText('');
        setEditedComment(null);
      }}
      >
        <Box p={2} sx={{ background: theme.palette.background.light, minWidth: 500, maxHeight: 450 }}>
          <Box maxHeight={350} pr={1} overflow='auto'>
            <Box justifyContent='space-between' display='flex' alignItems='center' mb={1}>
              <Typography color='secondary' variant='subtitle1' display='flex' flexDirection='row'>
                Started at {new Date(thread.createdAt).toLocaleString()}
              </Typography>
              <Box display='flex' gap={1}>
                <Button
                  disabled={isMutating}
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
                >Resolve
                </Button>
                <Button
                  onClick={deleteThread}
                  disabled={isMutating}
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
                  <ListItem sx={{
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
                        <ReviewerOption user={comment.user as any} avatarSize='small' />
                        <Typography color='secondary' variant='subtitle1' display='flex' flexDirection='row'>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
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
                    </Box>
                    {commentIndex === 0 && (
                      <Box my={1} pl={4} display='flex'>
                        <ContextBorder />
                        <Typography fontWeight={600} color='secondary'>{thread.context}</Typography>
                      </Box>
                    )}
                    <Typography pl={4}>{comment.content}</Typography>
                  </ListItem>
                </List>
              );
            })}
          </Box>
          <Box display='flex' gap={1} mt={thread.Comment.length !== 0 ? 1 : 0}>
            <TextField placeholder='Add a comment...' fullWidth size='small' onChange={(e) => setCommentText(e.target.value)} value={commentText} />
            <Button disabled={isMutating} size='small' onClick={() => editedComment ? editComment() : addComment()}>{editedComment ? 'Edit' : 'Add'}</Button>
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
              onClick={async () => {
                const comment = thread.Comment.find(_comment => _comment.id === targetedComment);
                if (comment) {
                  await charmClient.deleteComment(comment.id);
                  const threadWithoutComment = {
                    ...thread,
                    Comment: thread.Comment.filter(_comment => _comment.id !== comment.id)
                  };
                  setThreads((_threads) => ({ ..._threads, [thread.id]: threadWithoutComment }));
                  popupState.close();
                  setTargetedComment(null);
                }
              }}
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
        </Box>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

export function toggleInlineComment (): Command {
  return (state, dispatch) => {
    return toggleMark(getTypeFromSchema(state.schema))(state, dispatch);
  };
}

export function queryIsInlineCommentActive () {
  return (state: EditorState) => isMarkActiveInSelection(getTypeFromSchema(state.schema))(state);
}

export function createInlineComment () {
  return filter(
    (state) => queryIsInlineCommentAllowedInRange(
      state.selection.$from.pos,
      state.selection.$to.pos
    )(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const inlineCommentMark = state.schema.marks['inline-comment'];
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const createdInlineCommentMark = state.schema.marks['inline-comment'].create({
        id: null
      });
      tr.addMark(from, to, createdInlineCommentMark);

      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  );
}

function isTextAtPos (pos: number) {
  return (state: EditorState) => {
    const node = state.doc.nodeAt(pos);
    return !!node && node.isText;
  };
}

function setInlineComment (from: number, to: number, id?: string) {
  return filter(
    (state) => isTextAtPos(from)(state),
    (state, dispatch) => {
      const inlineCommentMark = state.schema.marks['inline-comment'];
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const mark = state.schema.marks['inline-comment'].create({
        id
      });
      tr.addMark(from, to, mark);
      if (dispatch) {
        dispatch(tr);
      }
      return true;
    }
  );
}

export function updateInlineComment (id: string): Command {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return setInlineComment(
        state.selection.$from.pos,
        state.selection.$to.pos,
        id
      )(state, dispatch);
    }

    const { $from } = state.selection;
    const pos = $from.pos - $from.textOffset;
    const node = state.doc.nodeAt(pos);
    let to = pos;

    if (node) {
      to += node.nodeSize;
    }

    return setInlineComment(pos, to, id)(state, dispatch);
  };
}

export function queryIsInlineCommentAllowedInRange (from: number, to: number) {
  return (state: EditorState) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const inlineCommentMark = state.schema.marks['inline-comment'];
    if ($from.parent === $to.parent && $from.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(inlineCommentMark);
    }
  };
}

export function queryIsSelectionAroundInlineComment () {
  return (state: EditorState) => {
    const { $from, $to } = state.selection;
    const node = $from.nodeAfter;
    return (
      !!node
      && $from.textOffset === 0
      && $to.pos - $from.pos === node.nodeSize
      && !!state.doc.type.schema.marks['inline-comment'].isInSet(node.marks)
    );
  };
}

