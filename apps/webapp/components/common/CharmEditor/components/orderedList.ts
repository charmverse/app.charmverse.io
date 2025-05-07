import type { Command, EditorState, Schema } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject } from '@bangle.dev/utils';
import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { toggleList } from './listItem/commands';
import { listIsTight } from './listItem/listIsTight';

export const spec = specFactory;
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

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        order: {
          default: 1
        },
        // a style preference attribute which be used for
        // rendering output.
        // For example markdown serializer can render a new line in
        // between or not.
        tight: {
          default: false
        },
        track: {
          default: []
        }
      },
      content: 'listItem+',
      group: 'block',
      parseDOM: [
        {
          tag: 'ol.old-list',
          getAttrs: (dom: any) => ({
            order: dom.hasAttribute('start') ? +dom.getAttribute('start')! : 1
          })
        }
      ],
      toDOM: (node) =>
        node.attrs.order === 1
          ? ['ol', { class: 'old-list' }, 0]
          : ['ol', { class: 'old-list', start: node.attrs.order }, 0]
    }
  };
}

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
