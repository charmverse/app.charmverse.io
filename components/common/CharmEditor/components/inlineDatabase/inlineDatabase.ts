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
        sourceId: {
          default: null
        },
        source: {
          default: 'page'
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
