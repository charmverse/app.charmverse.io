import type { Command, EditorState, Transaction } from 'prosemirror-state';
import type {} from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';
import type { MouseEvent } from 'react';

import { applyMark } from './applyMark';
import type { TextColorAttrs } from './config';
import { markName } from './config';
// import findNodesWithSameMark from './findNodesWithSameMark';
// import isTextStyleMarkCommandEnabled from './isTextStyleMarkCommandEnabled';
// import ColorEditor from './ui/ColorEditor';
// import createPopUp from './ui/createPopUp';
// import UICommand from './ui/UICommand';

export function executeWithUserInput(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView,
  color?: TextColorAttrs
): boolean {
  if (dispatch && color !== undefined) {
    const { schema } = state;
    let { tr } = state;
    const markType = schema.marks[markName];
    tr = applyMark(tr.setSelection(state.selection), markType, color);
    if (tr.docChanged || tr.storedMarksSet) {
      // If selection is empty, the color is added to `storedMarks`, which
      // works like `toggleMark`
      // (see https://prosemirror.net/docs/ref/#commands.toggleMark).
      dispatch(tr);
      return true;
    }
  }
  return false;
}
// class TextColorCommand extends UICommand {
//   _popUp = null;

//   isEnabled = (state: EditorState): boolean => {
//     return isTextStyleMarkCommandEnabled(state, markName);
//   };

//   // waitForUserInput = (
//   //   state: EditorState,
//   //   dispatch?: (tr: Transaction) => void,
//   //   view?: EditorView,
//   //   event?: MouseEvent
//   // ): Promise<any> => {
//   //   if (this._popUp) {
//   //     return Promise.resolve(undefined);
//   //   }
//   //   const target = event?.currentTarget;
//   //   if (!(target instanceof HTMLElement)) {
//   //     return Promise.resolve(undefined);
//   //   }

//   //   const { doc, selection, schema } = state;
//   //   const markType = schema.marks[markName];
//   //   const anchor = event ? event.currentTarget : null;
//   //   const { from, to } = selection;
//   //   const result = findNodesWithSameMark(doc, from, to, markType);
//   //   const hex = result ? result.mark.attrs.color : null;
//   //   return new Promise((resolve) => {
//   //     this._popUp = createPopUp(
//   //       ColorEditor,
//   //       { hex },
//   //       {
//   //         anchor,
//   //         onClose: (val) => {
//   //           if (this._popUp) {
//   //             this._popUp = null;
//   //             resolve(val);
//   //           }
//   //         }
//   //       }
//   //     );
//   //   });
//   // };
// }

// export default TextColorCommand;
