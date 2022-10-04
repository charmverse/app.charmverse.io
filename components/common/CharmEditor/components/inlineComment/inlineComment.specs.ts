import type { RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

import { markName } from './inlineComment.constants';

export function spec (): RawSpecs {
  return {
    type: 'mark',
    name: markName,
    schema: {
      inclusive: false,
      attrs: {
        id: {
          default: null
        },
        resolved: {
          default: false
        }
      },
      parseDOM: [
        {
          tag: 'span.charm-inline-comment'
        }
      ],
      toDOM: (mark): DOMOutputSpec => mark.attrs.id ? ['span', {
        class: `charm-inline-comment ${mark.attrs.resolved ? 'resolved' : 'active'}`,
        id: `inline-comment.${mark.attrs.id}`
      }] : ['span.charm-inline-comment']
    },
    markdown: {
      // TODO: Fix convert to markdown
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true
      },
      parseMarkdown: {
        strong: { mark: markName }
      }
    }
  };
}
