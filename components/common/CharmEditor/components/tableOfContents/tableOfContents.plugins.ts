import { NodeView } from '@bangle.dev/core';
import { Decoration, DecorationSet, Plugin, Selection } from '@bangle.dev/pm';

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'tableOfContents',
      containerDOM: ['div']
      // containerDOM: ['div', { draggable: 'false' }]
    }),
    new Plugin({
      name: 'tableOfContents',

      group: 'block',

      atom: true,

      parseHTML() {
        return [
          {
            tag: 'toc'
          }
        ];
      },

      renderHTML({ HTMLAttributes }) {
        return ['toc', mergeAttributes(HTMLAttributes)];
      },

      addNodeView() {
        return ReactNodeViewRenderer(Component);
      },

      addGlobalAttributes() {
        return [
          {
            types: ['heading'],
            attributes: {
              id: {
                default: null
              }
            }
          }
        ];
      }
    })
  ];
}
