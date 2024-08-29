import { keymap } from 'prosemirror-keymap';

import type { RawPlugins } from '../buildPlugins';
import { TAB_INDENT } from '../nodeNames';

export function plugins(): RawPlugins {
  return [
    keymap({
      // 'Shift-Tab': undentListItem,
      Tab: (state, dispatch) => {
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(state.schema.nodes[TAB_INDENT].create()).scrollIntoView());
        }
        return true;
      }
    })
  ];
}
