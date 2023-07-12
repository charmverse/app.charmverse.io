import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from 'prosemirror-state';

import { getColumnProperties } from '../columnLayout.schema';

export function ColumnNodeView({ name }: { name: string }) {
  return new Plugin({
    key: new PluginKey(`${name}-NodeView`),
    props: {
      nodeViews: {
        [name]: function nodeView(node) {
          const element = createElement(['div', getColumnProperties({ size: node.attrs.size })]);

          return {
            contentDOM: element,
            dom: element,
            // we need to ignore mutations caused by column-resizer (the style attribute is changed by column-resizer)
            ignoreMutation(mutation) {
              if (this.dom.contains(mutation.target)) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                  return true;
                }
                return false;
              }

              // if the this.dom itself was the target
              // do not ignore it. This is important for schema where
              // content: 'inline*' and you end up deleting all the content with backspace
              // PM needs to step in and create an empty node for us.
              // if (mutation.target === this.contentDOM) {
              //   return false;
              // }

              return true;
            },
            // tell prosemirror the node is updated when the attributes change, otherwise it will re-render the node
            update(newNode) {
              // dont update if the update is from another node type
              if (newNode.type.name !== name) {
                return false;
              }
              // keep html attributes up to date so that column resizer can be re-initialized
              const domAttrs = getColumnProperties({ size: newNode.attrs.size });
              this.contentDOM?.setAttribute('data-item-config', domAttrs['data-item-config']);

              return true;
            }
          };
        }
      }
    }
  });
}
