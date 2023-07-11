import { createElement } from '@bangle.dev/core';
import { log } from '@charmverse/core/log';
import { ColumnResizer } from '@column-resizer/core';
import debounce from 'lodash/debounce';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { NodeView } from 'prosemirror-view';

export function RowNodeView({ key, name }: { key: PluginKey; name: string }) {
  return new Plugin({
    key,
    props: {
      nodeViews: {
        [name]: function nodeViewFactory(node, view, getPos) {
          const element = createElement(['div', { class: 'charm-column-row' }]);

          const columnResizer = new ColumnResizer({ vertical: false });

          const resizeCallback = debounce(() => {
            const sizes = columnResizer
              .getResizer()
              .getResult()
              .sizeInfoArray.filter((sizeInfo) => !sizeInfo.isSolid) // remove the 'bar' resizer info
              .map((sizeInfo) => sizeInfo.currentSize);
            const columnUpdates = sizes.map((size) => ({ size, pos: -1 }));
            node.descendants((child, pos, parent, index) => {
              if (columnUpdates[index]) {
                columnUpdates[index].pos = getPos() + 1 + pos;
              } else {
                log.warn('Could not find column related to prosemirror node - columns may not work', pos);
              }
              return false; // do not descend
            });
            const transaction = view.state.tr;
            columnUpdates.forEach((update) => {
              if (update.pos > -1) {
                transaction.setNodeMarkup(update.pos, undefined, { size: update.size });
              }
            });
            view.dispatch(transaction);
          }, 100);

          // trigger this after child nodes are rendered
          setTimeout(() => {
            columnResizer.init(element);
            element.addEventListener('column:after-resizing' as any, resizeCallback);
          }, 0);

          const nodeView: NodeView = {
            contentDOM: element,
            dom: element,
            update(newNode) {
              // check if updated is node
              if (!node.sameMarkup(newNode)) return false;
              // if node has been updated, we need to re-init the column resizer as Prosemirror has re-rendered the decorations
              // An alternative would be to create a unique key for each column resizer, but this is easier
              setTimeout(() => {
                columnResizer.dispose();
                columnResizer.init(element);
              });
              return true;
            },
            // prevents a recursive loop when the column resizer updates the DOM
            // TODO: maybe we only need to ignore certain mutations?
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
            destroy() {
              element.removeEventListener('column:after-resizing' as any, resizeCallback);
              columnResizer.dispose();
            }
          };

          return nodeView;
        }
      }
    }
  });
}
