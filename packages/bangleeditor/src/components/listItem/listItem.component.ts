import type { Command, EditorState, Schema } from '@bangle.dev/pm';
import type { MoveDirection } from '@bangle.dev/pm-commands';
import { copyEmptyCommand, cutEmptyCommand, moveNode, parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { browser, domSerializationHelpers, filter, insertEmpty, createObject } from '@bangle.dev/utils';
import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import type { RawPlugins } from '../@bangle.dev/core/plugin-loader';
import type { RawSpecs } from '../@bangle.dev/core/specRegistry';

import {
  backspaceKeyCommand,
  enterKeyCommand,
  indentList,
  moveEdgeListItem,
  outdentList,
  updateNodeAttrs
} from './commands';
import { listItemNodeViewPlugin } from './listItem.nodeViewPlugin';
import { isNodeTodo, setTodoCheckedAttr } from './todo';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  indentListItem,
  outdentListItem,
  moveListItemUp,
  moveListItemDown
};
export const defaultKeys = {
  toggleDone: browser.mac ? 'Ctrl-Enter' : 'Ctrl-I',
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyListAbove: 'Mod-Shift-Enter',
  insertEmptyListBelow: 'Mod-Enter'
};

const name = 'listItem';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];
const isValidList = (state: EditorState) => {
  const type = getTypeFromSchema(state.schema);
  return parentHasDirectParentOfType(type, [state.schema.nodes.bulletList, state.schema.nodes.orderedList]);
};

function specFactory(): RawSpecs {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'li.old-list-item',
    // @ts-ignore DOMOutputSpec in @types is buggy
    content: 0
  });

  return {
    type: 'node',
    name,
    schema: {
      content: '(paragraph) (paragraph | bulletList | orderedList)*',
      defining: true,
      draggable: true,
      attrs: {
        // We overload the todoChecked value to
        // decide if its a regular bullet list or a list with todo
        // todoChecked can take following values:
        //   null => regular bullet list
        //   true => todo list with checked
        //   false => todo list with no check
        todoChecked: {
          default: null
        },
        track: {
          default: []
        }
      },
      toDOM,
      parseDOM
    }
  };
}

function pluginsFactory({ keybindings = defaultKeys, nodeView = true, readOnly = false } = {}): RawPlugins & {
  readOnly?: boolean;
} {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap({
          [keybindings.toggleDone]: filter(
            isValidList,
            updateNodeAttrs(schema.nodes.listItem, (attrs) => ({
              ...attrs,
              todoChecked: attrs.todoChecked == null ? false : !attrs.todoChecked
            }))
          ),

          // Backspace: backspaceKeyCommand(type),
          Enter: enterKeyCommand(type),
          ...createObject([
            [keybindings.indent, filter(isValidList, indentListItem())],
            [keybindings.outdent, filter(isValidList, outdentListItem())],
            [keybindings.moveUp, filter(isValidList, moveListItemUp())],
            [keybindings.moveDown, filter(isValidList, moveListItemDown())],
            [keybindings.emptyCut, filter(isValidList, cutEmptyCommand(type))],
            [keybindings.emptyCopy, filter(isValidList, copyEmptyCommand(type))],
            [keybindings.insertEmptyListAbove, insertEmptySiblingListAbove()],
            [keybindings.insertEmptyListBelow, insertEmptySiblingListBelow()]
          ])
        }),

      nodeView && listItemNodeViewPlugin(name, readOnly)
    ];
  };
}

export function indentListItem(): Command {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    return indentList(type)(state, dispatch);
  };
}

export function outdentListItem(): Command {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return outdentList(type)(state, dispatch, view);
  };
}

const isSelectionInsideTodo = (state: EditorState) => {
  return isNodeTodo(state.selection.$from.node(-1), state.schema);
};

function moveListItem(dir: MoveDirection): Command {
  return (state, dispatch, view) => {
    const { schema } = state;
    const type = getTypeFromSchema(schema);

    const isBulletList = parentHasDirectParentOfType(type, [schema.nodes.bulletList, schema.nodes.orderedList]);

    const move = (_dir: MoveDirection) =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      chainCommands(moveNode(type, _dir), (state, dispatch, view) => {
        const node = state.selection.$from.node(-3);
        const isParentTodo = isNodeTodo(node, state.schema);
        const result = moveEdgeListItem(type, dir)(state, dispatch, view);

        if (!result) {
          return false;
        }

        // if parent was a todo convert the moved edge node
        // to todo bullet item
        if (isParentTodo && dispatch) {
          const _state = view!.state;
          let { tr } = _state;
          const { schema: _schema } = _state;
          tr = setTodoCheckedAttr(tr, _schema, state.selection.$from.node(-1), state.selection.$from.before(-1));
          dispatch(tr);
        }
        return true;
      });

    return filter(isBulletList, move(dir))(state, dispatch, view);
  };
}

export function moveListItemUp() {
  return moveListItem('UP');
}
export function moveListItemDown() {
  return moveListItem('DOWN');
}

export function insertEmptySiblingList(isAbove = true): Command {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return chainCommands(
      filter(
        isSelectionInsideTodo,
        insertEmpty(type, isAbove ? 'above' : 'below', true, {
          todoChecked: false
        })
      ),
      filter(isValidList, insertEmpty(type, isAbove ? 'above' : 'below', true))
    )(state, dispatch, view);
  };
}

export function insertEmptySiblingListAbove() {
  return insertEmptySiblingList(true);
}

export function insertEmptySiblingListBelow() {
  return insertEmptySiblingList(false);
}
