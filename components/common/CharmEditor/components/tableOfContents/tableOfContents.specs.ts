import type { DOMOutputSpec } from 'prosemirror-model';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export function spec(): RawSpecs {
  return [
    {
      type: 'node',
      name: 'tableOfContents',
      schema: {
        inline: false,
        attrs: {
          track: {
            default: []
          }
        },
        group: 'block',
        parseDOM: [{ tag: 'toc' }],
        toDOM: (): DOMOutputSpec => {
          return ['toc'];
        },
        atom: true
      },
      markdown: {
        toMarkdown: (state, node) => {
          // try {
          //   state.write();
          //   state.ensureNewLine();
          // } catch (err) {
          //   log.warn('Conversion error (table of contents)', err);
          // }
        }
      }
    }
  ];
}
