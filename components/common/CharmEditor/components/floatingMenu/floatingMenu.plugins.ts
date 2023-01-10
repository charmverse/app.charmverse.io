import { link } from '@bangle.dev/base-components';
import { PluginKey } from '@bangle.dev/core';
import type { Node, ResolvedPos } from '@bangle.dev/pm';
import type { NodeSelection } from 'prosemirror-state';

import { hasComponentInSchema } from 'lib/prosemirror/hasComponentInSchema';

import { floatingMenu } from './floating-menu';

export const floatingMenuPluginKey = new PluginKey('floatingMenu');

// Components that should not trigger floating menu
const blacklistedComponents =
  'image cryptoPrice iframe page pdf mention tabIndent codeBlock inlineDatabase poll bookmark';

export function plugins({ readOnly, enableComments = true }: { readOnly?: boolean; enableComments?: boolean }) {
  const menuPlugins = floatingMenu({
    key: floatingMenuPluginKey,
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

      // If we are inside a link
      if (hasComponentInSchema(state, 'link')) {
        if (link.queryIsSelectionAroundLink()(state) || link.queryIsLinkActive()(state)) {
          return 'linkSubMenu';
        }
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

  return menuPlugins;
}
