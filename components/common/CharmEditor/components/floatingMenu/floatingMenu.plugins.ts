import { link } from '@bangle.dev/base-components';
import type { PluginKey } from '@bangle.dev/core';
import type { Node, Plugin, ResolvedPos } from '@bangle.dev/pm';
import { floatingMenu } from '@bangle.dev/react-menu';
import { hasComponentInSchema } from '@bangle.dev/react-menu/helper';
import type { NodeSelection } from 'prosemirror-state';

import { queryIsSelectionAroundInlineVote } from '../inlineVote';
import { markName as inlineVoteMarkName } from '../inlineVote/inlineVote.constants';

export function plugins ({ key, readOnly, enableComments = true }:{ key: PluginKey, readOnly?: boolean, enableComments?: boolean }) {
  const menuPlugins = floatingMenu.plugins({
    key,
    calculateType: (state) => {

      if (state.selection.empty
        || (state.selection as NodeSelection)?.node?.type?.name.match(
          /(image)|(cryptoPrice)|(iframe)|(page)|(pdf)|(mention)|(tabIndent)|(codeBlock)/
        )) {
        return null;
      }

      if (readOnly && enableComments) {
        return 'commentOnlyMenu';
      }

      if (readOnly) {
        return null;
      }

      // If we are inside an inline vote
      if (hasComponentInSchema(state, inlineVoteMarkName)) {
        if (queryIsSelectionAroundInlineVote()(state)) {
          return 'inlineVoteSubMenu';
        }
      }

      // If we are inside a link
      if (hasComponentInSchema(state, 'link')) {
        if (
          link.queryIsSelectionAroundLink()(state)
          || link.queryIsLinkActive()(state)
        ) {
          return 'linkSubMenu';
        }
      }

      // if inside a table, first check to see if we are resizing or not
      const isInsideTable = state.selection.$anchor
        .parent.type.name.match(/^(table_cell|table_header|horizontalRule)$/);
      if (isInsideTable) {
        const { path } = (state.selection.$anchor) as ResolvedPos & { path: Node[] };
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

      return 'defaultMenu';
    }
  });

  // We need to override the selection tooltip plugin to not show up when the rowAction plugin is handling drag and drop.
  // They both work through pm's active selection, but since this plugin responds to mousedown events, we can safely remove the listener to view updates
  const selectionTooltipPluginFn = menuPlugins[0] as (() => Plugin<any, any>[]);
  menuPlugins[0] = () => {
    const selectionTooltipPlugins = selectionTooltipPluginFn();
    const selectionTooltipController = selectionTooltipPlugins[1] as Plugin<any, any>;
    if (!selectionTooltipController.spec.view) {
      throw new Error('View not found for the selection toolip plugin');
    }
    // Remove the watcher in `view.update` to avoid triggering the tooltip when a selection changes
    // @ts-ignore
    const view = selectionTooltipController.spec.view();
    selectionTooltipController.spec.view = () => {
      view.update = () => {};
      return view;
    };
    return selectionTooltipPlugins;
  };

  return menuPlugins;
}
