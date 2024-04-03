import type { DOMOutputSpec } from 'prosemirror-model';

import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import { MAX_PDF_WIDTH } from 'lib/prosemirror/plugins/image/constants';

export type PdfNodeAttrs = {
  src?: string | null;
  size: number;
};

export function spec(): BaseRawNodeSpec {
  return {
    name: 'pdf',
    type: 'node',
    schema: {
      attrs: {
        src: {
          default: null
        },
        size: {
          default: MAX_PDF_WIDTH
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-pdf' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-pdf'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}
