import type { Command, InputRule } from '@bangle.dev/pm';
import { selectionTooltip } from '@bangle.dev/tooltip';
import type { SelectionTooltipProps } from '@bangle.dev/tooltip';
import { createObject, filter, rafCommandExec } from '@bangle.dev/utils';
import { keymap } from 'prosemirror-keymap';
import { PluginKey } from 'prosemirror-state';
import type { EditorState } from 'prosemirror-state';

import { hasComponentInSchema } from 'lib/prosemirror/hasComponentInSchema';

import { markName as inlineCommentMarkName } from '../inlineComment/inlineComment.constants';

const { queryIsSelectionTooltipActive, querySelectionTooltipType, hideSelectionTooltip, updateSelectionTooltipType } =
  selectionTooltip;

export const defaultKeys = {
  hide: 'Escape',
  toggleLink: 'Meta-k'
};

export type SubMenu = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu';

interface FloatingMenuPluginArgs extends Partial<SelectionTooltipProps> {
  keybindings?: { [index: string]: string };
}

export function floatingMenu({
  key = new PluginKey('floatingMenuPlugin'),
  keybindings = defaultKeys,
  tooltipRenderOpts = {},
  calculateType
}: FloatingMenuPluginArgs = {}): (undefined | Plugin | (() => Plugin) | InputRule)[] {
  return [
    selectionTooltip.plugins({
      key,
      calculateType,
      tooltipRenderOpts
    }),
    keybindings
      ? keymap(
          createObject([
            [keybindings.hide, filter(queryIsSelectionTooltipActive(key), hideSelectionTooltip(key))],
            [keybindings.toggleLink, toggleLinkSubMenu(key)]
          ])
        )
      : undefined
  ];
}
export function toggleSubMenu(floatingMenuPluginKey: PluginKey, subMenu: SubMenu): Command {
  const nodeName = subMenu === 'inlineCommentSubMenu' ? inlineCommentMarkName : 'link';
  return (state, _dispatch, view) => {
    const type = querySelectionTooltipType(floatingMenuPluginKey)(state);

    if (!hasComponentInSchema(state, nodeName)) {
      return false;
    }

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === subMenu) {
        rafCommandExec(view!, focusFloatingMenuInput(floatingMenuPluginKey));
      }
      return false;
    }

    if (type === subMenu) {
      return hideSelectionTooltip(floatingMenuPluginKey)(view!.state, view!.dispatch, view);
    }

    rafCommandExec(view!, focusFloatingMenuInput(floatingMenuPluginKey));

    return updateSelectionTooltipType(floatingMenuPluginKey, subMenu)(view!.state, view!.dispatch, view);
  };
}

export function toggleLinkSubMenu(key: PluginKey): Command {
  return (state, _dispatch, view) => {
    const type = querySelectionTooltipType(key)(state);

    if (!view || !hasComponentInSchema(state, 'link')) {
      return false;
    }

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === 'linkSubMenu') {
        rafCommandExec(view, focusFloatingMenuInput(key));
      }
      return false;
    }

    if (type === 'linkSubMenu') {
      return hideSelectionTooltip(key)(view.state, view.dispatch, view);
    }

    rafCommandExec(view, focusFloatingMenuInput(key));

    return updateSelectionTooltipType(key, 'linkSubMenu')(view.state, view.dispatch, view);
  };
}

export function focusFloatingMenuInput(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);

    const input = pluginState.tooltipContentDOM.querySelector('input');
    if (!input) {
      return false;
    }
    input.focus();
    return true;
  };
}
