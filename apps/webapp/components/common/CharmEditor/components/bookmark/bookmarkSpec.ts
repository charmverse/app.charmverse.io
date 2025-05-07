import type { DOMOutputSpec, Node } from 'prosemirror-model';

import type { BaseRawNodeSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export type BookmarkNodeAttrs = {
  url: string;
};

export function spec(): BaseRawNodeSpec {
  return {
    name: 'bookmark',
    type: 'node',
    schema: {
      attrs: {
        url: {
          default: null
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'div.charm-bookmark',
          getAttrs: (dom: any): BookmarkNodeAttrs => {
            return {
              url: dom.getAttribute('bookmark-url')
            };
          }
        }
      ],
      toDOM: (node: Node): DOMOutputSpec => {
        return [
          'div.charm-bookmark',
          {
            'bookmark-url': node.attrs.url
          }
        ];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        const { url } = node.attrs as BookmarkNodeAttrs;
        // Ensure markdown html will be separated by newlines
        state.ensureNewLine();
        state.text(url);
        state.ensureNewLine();
      }
    }
  };
}
