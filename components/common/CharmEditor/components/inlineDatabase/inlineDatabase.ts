import { BaseRawNodeSpec, RawPlugins } from '@bangle.dev/core';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { DOMOutputSpec, keymap } from '@bangle.dev/pm';
import { filter, findParentNodeOfType } from '@bangle.dev/utils';

export function spec () {
  return [
    databaseSpec()
  ];
}

function databaseSpec (): BaseRawNodeSpec {
  return {
    name: 'inlineDatabase',
    type: 'node',
    schema: {
      attrs: {
        source: {
          default: 'board_page'
        },
        linkedSourceId: {
          default: null
        },
        type: {
          default: 'linked'
        }
      },
      atom: true,
      selectable: false,
      isolating: true,
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-database' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-database'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
