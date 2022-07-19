import { RawSpecs } from '@bangle.dev/core';
import { DOMOutputSpec } from '@bangle.dev/pm';
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
      toDOM: (mark): DOMOutputSpec => ['span', {
        class: mark.attrs.id ? `charm-inline-comment ${mark.attrs.resolved ? 'resolved' : 'active'}` : '',
        id: mark.attrs.id ? `inline-comment.${mark.attrs.id}` : ''
      }]
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
