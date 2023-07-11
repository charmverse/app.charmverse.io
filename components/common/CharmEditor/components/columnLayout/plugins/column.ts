import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from 'prosemirror-state';

import { getColumnProperties } from '../columnLayout.schema';

export function ColumnNodeView({ name }: { name: string }) {
  return new Plugin({
    key: new PluginKey(`${name}-NodeView`),
    props: {
      nodeViews: {
        [name]: function nodeView(node, view, getPos) {
          const element = createElement(['div', getColumnProperties({ size: node.attrs.size })]);

          return {
            contentDOM: element,
            dom: element,
            ignoreMutation(mutation) {
              return true;
              // ref bangle.dev: https://discuss.prosemirror.net/t/nodeviews-with-contentdom-stops-the-cursor-movement-for-a-node-with-text-content/3208/6
              // if a child of this.dom (the one handled by PM)
              // has any mutation, do not ignore it
              if (this.dom.contains(mutation.target)) {
                return false;
              }

              // if the this.dom itself was the target
              // do not ignore it. This is important for schema where
              // content: 'inline*' and you end up deleting all the content with backspace
              // PM needs to step in and create an empty node for us.
              if (mutation.target === this.contentDOM) {
                return false;
              }

              return true;
            },
            // tell prosemirror the node is updated when the attributes change, otherwise it will re-render the node
            update(newNode) {
              if (newNode.type.name === name) {
                if (node.sameMarkup(newNode)) {
                  return false;
                }
                // keep html attributes up to date - might be useful in the future
                const domAttrs = getColumnProperties({ size: newNode.attrs.size });
                if (this.contentDOM) {
                  this.contentDOM.setAttribute('data-item-config', domAttrs['data-item-config']);
                }
                return true;
              }
              // console.log('view.update: confirm column node updated');
              return false;
            }
          };
        }
      }
    }
  });
}
