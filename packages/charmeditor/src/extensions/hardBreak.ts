import { chainCommands, exitCode } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import type { DOMOutputSpec } from 'prosemirror-model';

import type { RawPlugins } from '../buildPlugins';
import type { BaseRawNodeSpec } from '../buildSchema';
import { HARD_BREAK } from '../nodeNames';
import { getNodeType } from '../utils/pmHelpers';

export function plugins(): RawPlugins {
  return ({ schema }) => {
    const type = getNodeType(schema, HARD_BREAK);
    const command = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      }
      return true;
    });
    return [keymap({ 'Shift-Enter': command })];
  };
}

export const spec: BaseRawNodeSpec = {
  type: 'node',
  name: HARD_BREAK,
  schema: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM: (): DOMOutputSpec => ['br']
  },
  markdown: {
    toMarkdown: (state) => {
      state.write('\n');
    },
    parseMarkdown: {
      hardbreak: { node: 'hardBreak' }
    }
  }
};
