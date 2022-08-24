import { BaseRawNodeSpec } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';

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
