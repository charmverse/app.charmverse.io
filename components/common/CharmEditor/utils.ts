import type { EditorState, Node, Transaction } from '@bangle.dev/pm';
import { safeInsert } from '@bangle.dev/utils';

import type { PageContent } from 'models';

export function insertNode (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, nodeToInsert: Node) {
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

export function isAtBeginningOfLine (state: EditorState) {
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const parentOffset = state.selection.$cursor?.parentOffset;
  return parentOffset === 0;
}

export const safeRequestAnimationFrame = typeof window !== 'undefined' && window.requestAnimationFrame
  ? window.requestAnimationFrame
  : function (callback: ((time: number) => void)) {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - ((window as any).lastTime ?? 0)));
    const id = window.setTimeout(() => {
      callback(currTime + timeToCall);
    }, timeToCall);
    (window as any).lastTime = currTime + timeToCall;
    return id;
  };
