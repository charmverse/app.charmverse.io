import type { Command, EditorState, Schema } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject } from '@bangle.dev/utils';
import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import type { RawPlugins } from './@bangle.dev/core/plugin-loader';
import { toggleList } from './listItem/commands';
import { listIsTight } from './listItem/listIsTight';

export const plugins = pluginsFactory;
export const commands = {
  toggleOrderedList,
  queryIsOrderedListActive
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-9'
};

const name = 'orderedList';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      wrappingInputRule(
        /^(1)[.)]\s$/,
        type,
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1]
      ),
      keybindings && keymap(createObject([[keybindings.toggle, toggleList(type)]]))
    ];
  };
}

export function toggleOrderedList(): Command {
  return (state, dispatch, view) => {
    return toggleList(state.schema.nodes.orderedList, state.schema.nodes.listItem)(state, dispatch, view);
  };
}

export function queryIsOrderedListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes.listItem, [schema.nodes[name]])(state);
  };
}
