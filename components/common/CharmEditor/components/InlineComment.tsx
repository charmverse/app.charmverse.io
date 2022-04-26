import { RawPlugins, RawSpecs, Plugin } from '@bangle.dev/core';
import { Schema, DOMOutputSpec, Command, toggleMark, EditorState, PluginKey, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';
import { ClickAwayListener } from '@mui/material';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { hideSuggestionsTooltip, renderSuggestionsTooltip, SuggestTooltipPluginKey, SuggestTooltipPluginState } from './@bangle.dev/tooltip/suggest-tooltip';
import PageThread from './Threads/PageThread';

const name = 'inline-comment';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

export function inlineCommentSpec (): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      inclusive: false,
      attrs: {
        id: {
          default: null
        },
        resolved: {
          default: false
        }
      },
      parseDOM: [
        {
          tag: 'span.charm-inline-comment'
        }
      ],
      toDOM: (mark): DOMOutputSpec => ['span', { class: `charm-inline-comment ${mark.attrs.resolved ? 'resolved' : 'active'}`, id: `inline-comment.${mark.attrs.id}` }]
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
          const { $from, $to } = view.state.selection;
          const fromNodeAfter = $from.nodeAfter;
          const toNodeAfter = $to.nodeAfter;
          if (!toNodeAfter) {
            const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
            view.dispatch(tr);
            return true;
          }
          if (fromNodeAfter) {
            const inlineCommentMark = view.state.doc.type.schema.marks['inline-comment'].isInSet(fromNodeAfter.marks);
            const pageThreadListNode = document.querySelector('.PageThreadList-portal');
            const isShowingCommentThreadsList = pageThreadListNode?.children.length !== 0;
            const threadId = inlineCommentMark?.attrs.id;
            if (threadId) {
              // If we are showing the thread list on the right, then navigate to the appropriate thread and highlight it
              if (isShowingCommentThreadsList) {
                // Use regular dom methods as we have no access to a ref inside a plugin
                // Plus this is only a cosmetic change which doesn't impact any of the state
                const threadDocument = document.getElementById(`thread.${threadId}`);
                if (threadDocument) {
                  threadDocument?.scrollIntoView({
                    behavior: 'smooth'
                  });
                  threadDocument.style.backgroundColor = 'rgba(46, 170, 220, 0.2)';
                  threadDocument.style.transition = 'background-color 250ms ease-in-out';
                  // Remove the highlight after 500 ms
                  setTimeout(() => {
                    threadDocument.style.removeProperty('background-color');
                    threadDocument.style.transition = 'background-color 250ms ease-in-out';
                  }, 500);
                }
              }
              else {
                // If the page thread list isn't open, then we need to show the inline thread component
                renderSuggestionsTooltip(SuggestTooltipPluginKey, {
                  component: 'inlineComment',
                  threadId
                })(view.state, view.dispatch, view);
              }
            }
          }
          return true;
        }
      }
    })
  ];
}

export function InlineCommentThread ({ showingCommentThreadsList }: {showingCommentThreadsList: boolean}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    component,
    threadId
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;
  const { threads } = useThreads();
  const thread = threadId && threads[threadId];
  if (isVisible && component === 'inlineComment' && thread && !thread.resolved) {
    // Only show comment thread on inline comment if the page threads list is not active
    return !showingCommentThreadsList ? createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
      }}
      >
        <PageThread threadId={threadId} inline />
      </ClickAwayListener>,
      tooltipContentDOM
    ) : null;
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
      // Id will be available after the thread has been created
      && !node.marks.find(mark => mark?.type?.name === name)?.attrs.id
      && !!state.doc.type.schema.marks['inline-comment'].isInSet(node.marks)
    );
  };
}

