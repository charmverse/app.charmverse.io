import type { Node, ResolvedPos } from 'prosemirror-model';
import type { EditorState, NodeSelection, PluginKey, Plugin, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { floatingMenu } from './floatingMenuPlugin';

// Components that should not trigger floating menu
const blacklistedComponents =
  'nft embed video image cryptoPrice farcasterFrame iframe page pdf mention tabIndent codeBlock inlineDatabase poll bookmark tableOfContents file poll';

export function plugins({
  key,
  readOnly,
  enableComments = true
}: {
  key: PluginKey;
  readOnly?: boolean;
  enableComments?: boolean;
}) {
  const menuPlugins = floatingMenu({
    key,
    calculateType: (state) => {
      const nodeName = (state.selection as NodeSelection)?.node?.type?.name;
      if (blacklistedComponents.includes(nodeName)) {
        return null;
      }

      if (readOnly) {
        if (enableComments && !state.selection.empty) {
          return 'commentOnlyMenu';
        }
        return null;
      }

      // if inside a table, first check to see if we are resizing or not
      const isInsideTable = state.selection.$anchor.parent.type.name.match(
        /^(table_cell|table_header|horizontalRule)$/
      );
      if (isInsideTable) {
        const { path } = state.selection.$anchor as ResolvedPos & { path: Node[] };
        if (path) {
          for (let index = path.length - 1; index > 0; index--) {
            const node = path[index];
            // We are inside a paragraph, then show floating menu
            if (node.type && node.type.name === 'paragraph') {
              return 'defaultMenu';
            }
          }
          // We are not inside a paragraph, so dont show floating menu
          return null;
        }
      }
      if (state.selection.empty) {
        return null;
      }

      return 'defaultMenu';
    }
  });

  // We need to override the selection tooltip plugin to not show up when the rowAction plugin is handling drag and drop.
  // They both work through pm's active selection, but since this plugin responds to mousedown events, we can safely remove the listener to view updates
  const selectionTooltipPluginFn = menuPlugins[0] as () => Plugin<any>[];

  menuPlugins[0] = () => {
    const selectionTooltipPlugins = selectionTooltipPluginFn();
    const controller = selectionTooltipPlugins[1] as Plugin<any>;
    if (!controller.spec.view) {
      throw new Error('View not found for the selection tooltip plugin');
    }
    // @ts-ignore
    const viewUpdate = controller.spec.view().update;
    Object.assign(controller.spec, {
      state: {
        init() {
          return false;
        },
        // update state when row action plugin is dragging
        apply(tr: Transaction) {
          return tr.getMeta('row-handle-is-dragging');
        }
      },
      view: (_view: EditorView) => {
        return {
          update: (view: EditorView, lastState: EditorState) => {
            const isDragging = controller.getState(view.state) || controller.getState(lastState);
            if (viewUpdate && !isDragging) {
              return viewUpdate(view, lastState);
            }
          }
        };
      }
    });
    return selectionTooltipPlugins;
  };

  return menuPlugins;
}
