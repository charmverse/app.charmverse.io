import { RawPlugins } from '@bangle.dev/core';
import { Command, keymap, sinkListItem, liftListItem } from '@bangle.dev/pm';

const indentListItem: Command = (state, dispatch) => {
  const type = state.schema.nodes.listItem;
  return sinkListItem(type)(state, dispatch);
};

const undentListItem: Command = (state, dispatch) => {
  const type = state.schema.nodes.listItem;
  return liftListItem(type)(state, dispatch);
};

export function plugins (): RawPlugins {
  return [
    keymap({
      'Shift-Tab': undentListItem,
      Tab: indentListItem
    })
  ];
}
