import { GapCursorSelection } from '@bangle.dev/utils';
import type { Node } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import { safeInsert } from 'prosemirror-utils';
import type { EditorView } from 'prosemirror-view';

export function insertNode(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  nodeToInsert: Node,
  inheritMarks = true
) {
  const insertPos = state.selection.$from.after();

  const tr = state.tr;
  const newTr = safeInsert(nodeToInsert, insertPos)(state.tr);

  if (tr === newTr) {
    return false;
  }

  if (dispatch) {
    dispatch(newTr.scrollIntoView());
  }

  return true;
}

export function isAtBeginningOfLine(state: EditorState) {
  const { empty, $from } = state.selection;
  return empty && ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection);
}

export const safeRequestAnimationFrame =
  typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame
    : function (callback: (time: number) => void) {
        const currTime = new Date().getTime();
        const timeToCall = Math.max(0, 16 - (currTime - ((window as any).lastTime ?? 0)));
        const id = window.setTimeout(() => {
          callback(currTime + timeToCall);
        }, timeToCall);
        (window as any).lastTime = currTime + timeToCall;
        return id;
      };
export function enableDragAndDrop(view: EditorView, nodePos: number | undefined) {
  if (typeof nodePos === 'number') {
    view.dispatch(
      view.state.tr.setMeta('row-handle-is-dragging', true).setSelection(NodeSelection.create(view.state.doc, nodePos))
    );
  }
}
