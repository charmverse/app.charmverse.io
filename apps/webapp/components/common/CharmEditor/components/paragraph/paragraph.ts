import {
  copyEmptyCommand,
  cutEmptyCommand,
  jumpToEndOfNode,
  jumpToStartOfNode,
  moveNode,
  parentHasDirectParentOfType
} from '@bangle.dev/pm-commands';
import {
  browser,
  createObject,
  filter,
  findParentNodeOfType,
  getNodeType,
  getParaNodeType,
  insertEmpty
} from '@bangle.dev/utils';
import { setBlockType } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import type { Node, DOMOutputSpec } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';

import type { RawPlugins } from '../@bangle.dev/core/plugin-loader';

export const plugins = pluginsFactory;
export const commands = {
  convertToParagraph,
  jumpToStartOfParagraph,
  jumpToEndOfParagraph,
  queryIsParagraph,
  queryIsTopLevelParagraph,
  insertEmptyParagraphAbove,
  insertEmptyParagraphBelow
};

export const defaultKeys = {
  jumpToEndOfParagraph: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
  jumpToStartOfParagraph: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
  convertToParagraph: 'Ctrl-Shift-0'
};

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getParaNodeType(schema);
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, getNodeType(schema, 'doc'));
    return [
      keybindings &&
        keymap(
          createObject([
            [keybindings.convertToParagraph, convertToParagraph()],

            [keybindings.moveUp, filter(isTopLevel, moveNode(type, 'UP'))],
            [keybindings.moveDown, filter(isTopLevel, moveNode(type, 'DOWN'))],

            [keybindings.jumpToStartOfParagraph, jumpToStartOfNode(type)],
            [keybindings.jumpToEndOfParagraph, jumpToEndOfNode(type)],

            [keybindings.emptyCopy, filter(isTopLevel, copyEmptyCommand(type))],
            [keybindings.emptyCut, filter(isTopLevel, cutEmptyCommand(type))],

            [keybindings.insertEmptyParaAbove, filter(isTopLevel, insertEmpty(type, 'above'))],
            [keybindings.insertEmptyParaBelow, filter(isTopLevel, insertEmpty(type, 'below'))]
          ])
        )
    ];
  };
}

// Commands
export function convertToParagraph(): Command {
  return (state, dispatch) => setBlockType(getParaNodeType(state))(state, dispatch);
}

export function queryIsTopLevelParagraph() {
  return (state: EditorState) => {
    const type = getParaNodeType(state);
    return parentHasDirectParentOfType(type, getNodeType(state, 'doc'))(state);
  };
}

export function queryIsParagraph() {
  return (state: EditorState) => {
    const type = getParaNodeType(state);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}

export function insertEmptyParagraphAbove(): Command {
  return (state, dispatch, view) => {
    const type = getParaNodeType(state);
    return filter(parentHasDirectParentOfType(type, getNodeType(state, 'doc')), insertEmpty(type, 'above'))(
      state,
      dispatch,
      view
    );
  };
}

export function insertEmptyParagraphBelow(): Command {
  return (state, dispatch, view) => {
    const type = getParaNodeType(state);
    return filter(parentHasDirectParentOfType(type, getNodeType(state, 'doc')), insertEmpty(type, 'below'))(
      state,
      dispatch,
      view
    );
  };
}

export function jumpToStartOfParagraph(): Command {
  return (state, dispatch) => {
    const type = getParaNodeType(state);
    return jumpToStartOfNode(type)(state, dispatch);
  };
}

export function jumpToEndOfParagraph(): Command {
  return (state, dispatch) => {
    const type = getParaNodeType(state);
    return jumpToEndOfNode(type)(state, dispatch);
  };
}
