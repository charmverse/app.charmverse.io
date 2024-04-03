import type { DOMOutputSpec } from 'prosemirror-model';

import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { markName } from './inlineVote.constants';

export function spec(): RawSpecs {
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
      toDOM: (mark): DOMOutputSpec => [
        'span',
        {
          class: `charm-inline-vote ${mark.attrs.resolved ? 'resolved' : 'active'}`,
          id: `inline-vote.${mark.attrs.id}`
        }
      ]
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
