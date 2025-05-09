import { createObject, filter, rafCommandExec } from '@bangle.dev/utils';
import { markName as inlineCommentMarkName } from '@packages/bangleeditor/components/inlineComment/inlineComment.constants';
import type { InputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { PluginKey } from 'prosemirror-state';
import type { Command, EditorState, Plugin } from 'prosemirror-state';

import { hasComponentInSchema } from 'lib/prosemirror/hasComponentInSchema';

import {
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
  hideSelectionTooltip,
  updateSelectionTooltipType
} from '../@bangle.dev/tooltip/selectionTooltip';
import type { SelectionTooltipProps } from '../@bangle.dev/tooltip/selectionTooltipPlugin';
import { plugins as selectionTooltipPlugins } from '../@bangle.dev/tooltip/selectionTooltipPlugin';

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
}: FloatingMenuPluginArgs = {}): (undefined | Plugin | (() => Plugin | Plugin[]) | InputRule)[] {
  return [
    selectionTooltipPlugins({
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
