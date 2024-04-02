import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';
import { toggleMark } from 'prosemirror-commands';
import type { Command, EditorState } from 'prosemirror-state';

import { markName } from './inlineComment.constants';

const getMarkFromState = (state: EditorState) => state.schema.marks[markName];

export function toggleInlineComment(): Command {
  return (state, dispatch) => {
    return toggleMark(getMarkFromState(state))(state, dispatch);
  };
}

export function queryIsInlineCommentActive() {
  return (state: EditorState) => isMarkActiveInSelection(getMarkFromState(state))(state);
}

export function createInlineComment() {
  return filter(
    (state) => queryIsInlineCommentAllowedInRange(state.selection.$from.pos, state.selection.$to.pos)(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const inlineCommentMark = getMarkFromState(state);
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const createdInlineCommentMark = inlineCommentMark.create({
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

function isTextAtPos(pos: number) {
  return (state: EditorState) => {
    const node = state.doc.nodeAt(pos);
    return !!node && (node.isText || node.type.name.match(/(emoji|mention)/));
  };
}

function setInlineComment(from: number, to: number, id?: string) {
  return filter(
    (state) => isTextAtPos(from)(state),
    (state, dispatch) => {
      const inlineCommentMark = getMarkFromState(state);
      const tr = state.tr.removeMark(from, to, inlineCommentMark);
      const mark = inlineCommentMark.create({
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

export function updateInlineComment(id: string): Command {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return setInlineComment(state.selection.$from.pos, state.selection.$to.pos, id)(state, dispatch);
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

export function queryIsInlineCommentAllowedInRange(from: number, to: number) {
  return (state: EditorState) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const inlineCommentMark = getMarkFromState(state);
    if ($to.parent.isTextblock && $from.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(inlineCommentMark) && $to.parent.type.allowsMarkType(inlineCommentMark);
    }
  };
}

export function queryIsSelectionAroundInlineComment() {
  return (state: EditorState) => {
    const { $from, $to } = state.selection;
    const node = $from.nodeAfter;

    return (
      !!node &&
      $from.textOffset === 0 &&
      $to.pos - $from.pos === node.nodeSize &&
      // Id will be available after the thread has been created
      !node.marks.find((mark) => mark?.type?.name === markName)?.attrs.id &&
      !!state.doc.type.schema.marks[markName].isInSet(node.marks)
    );
  };
}

export function scrollToThread(threadId: string) {
  // Find the inline-comment with the threadId and scroll into view
  const threadDocument = document.getElementById(`inline-comment.${threadId}`);
  if (threadDocument) {
    threadDocument.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
