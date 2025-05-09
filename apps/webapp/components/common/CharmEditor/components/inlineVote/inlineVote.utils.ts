import { filter } from '@bangle.dev/utils';
import type { Command, EditorState } from 'prosemirror-state';

import { markName } from './inlineVote.constants';

const getMarkFromState = (state: EditorState) => state.schema.marks[markName];

export function queryIsInlineVoteAllowedInRange(from: number, to: number) {
  return (state: EditorState) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const inlineVoteMark = getMarkFromState(state);
    if ($from.parent.isTextblock && $to.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(inlineVoteMark) && $to.parent.type.allowsMarkType(inlineVoteMark);
    }
  };
}

export function queryIsSelectionAroundInlineVote() {
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

export function createInlineVote() {
  return filter(
    (state) => queryIsInlineVoteAllowedInRange(state.selection.$from.pos, state.selection.$to.pos)(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const inlineVoteMark = getMarkFromState(state);
      const tr = state.tr.removeMark(from, to, inlineVoteMark);
      const createdInlineVoteMark = inlineVoteMark.create({
        id: null
      });
      tr.addMark(from, to, createdInlineVoteMark);

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

function setInlineVote(from: number, to: number, id?: string) {
  return filter(
    (state) => isTextAtPos(from)(state),
    (state, dispatch) => {
      const inlineVoteMark = getMarkFromState(state);
      const tr = state.tr.removeMark(from, to, inlineVoteMark);
      const mark = inlineVoteMark.create({
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

export function updateInlineVote(id: string): Command {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return setInlineVote(state.selection.$from.pos, state.selection.$to.pos, id)(state, dispatch);
    }

    const { $from } = state.selection;
    const pos = $from.pos - $from.textOffset;
    const node = state.doc.nodeAt(pos);
    let to = pos;

    if (node) {
      to += node.nodeSize;
    }

    return setInlineVote(pos, to, id)(state, dispatch);
  };
}
