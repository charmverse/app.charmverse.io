import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export function spec() {
  return [databaseSpec()];
}

function databaseSpec(): BaseRawNodeSpec {
  return {
    name: 'inlineDatabase',
    type: 'node',
    schema: {
      attrs: {
        pageId: {
          default: null
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
