import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject } from '@bangle.dev/utils';
import { chainCommands } from 'prosemirror-commands';
import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node, Schema } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';

import type { RawPlugins } from './@bangle.dev/core/plugin-loader';
import type { RawSpecs } from './@bangle.dev/core/specRegistry';
import { toggleList } from './listItem/commands';
import { isNodeTodo, removeTodo, setTodo, wrappingInputRuleForTodo } from './listItem/todo';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBulletList,
  queryIsBulletListActive
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-8',
  toggleTodo: 'Shift-Ctrl-7'
};

const name = 'bulletList';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul.old-list' }],
      toDOM: (): DOMOutputSpec => ['ul', { class: 'old-list' }, 0],
      attrs: {
        // a style preference attribute which be used for
        // rendering output.
        // For example markdown serializer can render a new line in
        // between or not.
        tight: {
          default: false
        }
      }
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.renderList(node, '  ', () => '- ');
      }
    }
  };
}

function pluginsFactory({
  markdownShortcut = true,
  todoMarkdownShortcut = true,
  keybindings = defaultKeys
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap(
          createObject([
            [keybindings.toggle, toggleBulletList()],
            [keybindings.toggleTodo, toggleTodoList()]
          ])
        ),
      markdownShortcut &&
        wrappingInputRule(/^\s*([-+*])\s$/, type, undefined, (_str, node) => {
          if (node.lastChild && isNodeTodo(node.lastChild, schema)) {
            return false;
          }
          return true;
        }),
      todoMarkdownShortcut &&
        wrappingInputRuleForTodo(/^\s*(\[ \])\s$/, {
          todoChecked: false
        })
    ];
  };
}

export function toggleBulletList(): Command {
  const handleBulletLists: Command = (state, dispatch, view) =>
    toggleList(state.schema.nodes.bulletList, state.schema.nodes.listItem)(state, dispatch, view);

  return chainCommands(removeTodo, handleBulletLists);
}

export function toggleTodoList(): Command {
  const fallback: Command = (state, dispatch, view) =>
    toggleList(state.schema.nodes.bulletList, state.schema.nodes.listItem, true)(state, dispatch, view);

  return chainCommands(setTodo, fallback);
}

export function queryIsBulletListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes.listItem, [schema.nodes.bulletList])(state);
  };
}

export function queryIsTodoListActive() {
  return (state: EditorState) => {
    const { schema } = state;

    return (
      parentHasDirectParentOfType(schema.nodes.listItem, [schema.nodes.bulletList])(state) &&
      isNodeTodo(state.selection.$from.node(-1), schema)
    );
  };
}
