import { Command } from "@bangle.dev/pm";
import { focusFloatingMenuInput } from "@bangle.dev/react-menu/floating-menu";
import { hasComponentInSchema } from "@bangle.dev/react-menu/helper";
import { querySelectionTooltipType, hideSelectionTooltip, updateSelectionTooltipType } from "@bangle.dev/tooltip/selection-tooltip";
import { rafCommandExec } from "@bangle.dev/utils";
import { PluginKey } from "prosemirror-state";

export function toggleSubMenu(floatingMenuPluginKey: PluginKey, subMenu: 'linkSubMenu' | 'inlineCommentSubMenu'): Command {
  let nodeName = subMenu === "inlineCommentSubMenu" ? 'inline-comment' : 'link'
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

    return updateSelectionTooltipType(floatingMenuPluginKey, subMenu)(
      view!.state,
      view!.dispatch,
      view,
    );
  };
}

