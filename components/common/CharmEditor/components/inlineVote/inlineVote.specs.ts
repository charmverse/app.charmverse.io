import type { RawSpecs } from '@bangle.dev/core';
import type { DOMOutputSpec } from '@bangle.dev/pm';

import { markName } from './inlineVote.constants';

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
          tag: 'span.charm-inline-vote'
        }
      ],
      toDOM: (mark): DOMOutputSpec => ['span', { class: `charm-inline-vote ${mark.attrs.resolved ? 'resolved' : 'active'}`, id: `inline-vote.${mark.attrs.id}` }]
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
