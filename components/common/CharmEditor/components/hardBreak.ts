import type { RawPlugins } from '@bangle.dev/core';
import { createObject, getNodeType } from '@bangle.dev/utils';
import { chainCommands, exitCode } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

const defaultKeys = {
  insert: 'Shift-Enter'
};

const name = 'hardBreak';

export function plugins({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getNodeType(schema, name);
    const command = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      }
      return true;
    });
    return [keybindings && keymap(createObject([[keybindings.insert, command]]))];
  };
}

export function hardBreakSpec() {
  const charmHardBreakSpec: BaseRawNodeSpec = {
    type: 'node',
    name,
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

  return charmHardBreakSpec;
}
