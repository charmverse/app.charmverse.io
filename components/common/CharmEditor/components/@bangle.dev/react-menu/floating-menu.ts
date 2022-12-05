import type { Command } from '@bangle.dev/pm';
import { floatingMenu } from '@bangle.dev/react-menu';
import { selectionTooltip } from '@bangle.dev/tooltip';
import { rafCommandExec } from '@bangle.dev/utils';
import type { PluginKey } from 'prosemirror-state';

import { hasComponentInSchema } from 'lib/prosemirror/hasComponentInSchema';

import { markName as inlineCommentMarkName } from '../../inlineComment/inlineComment.constants';
import { markName as inlineVoteMarkName } from '../../inlineVote/inlineVote.constants';

const hideSelectionTooltip = selectionTooltip.hideSelectionTooltip;
const querySelectionTooltipType = selectionTooltip.querySelectionTooltipType;
const updateSelectionTooltipType = selectionTooltip.updateSelectionTooltipType;

const focusFloatingMenuInput = floatingMenu.focusFloatingMenuInput;
export type SubMenu = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu' | 'inlineVoteSubMenu';

export function toggleSubMenu(floatingMenuPluginKey: PluginKey, subMenu: SubMenu): Command {
  const nodeName =
    subMenu === 'inlineCommentSubMenu'
      ? inlineCommentMarkName
      : subMenu === 'inlineVoteSubMenu'
      ? inlineVoteMarkName
      : 'link';
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
