import {
  copyEmptyCommand,
  cutEmptyCommand,
  jumpToEndOfNode,
  jumpToStartOfNode,
  moveNode
} from '@bangle.dev/pm-commands';
import { browser, filter, findParentNodeOfType, insertEmpty, createObject } from '@bangle.dev/utils';
import { slugify } from '@packages/utils/strings';
import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Node, Schema } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';
import type { Command, EditorState, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';

export const plugins = pluginsFactory;
export const commands = {
  toggleHeading,
  queryIsHeadingActive
};

interface OptionsType {
  levels: number[];
}
export const keybindings: { [index: string]: string | undefined } = {
  toH1: 'Shift-Ctrl-1',
  toH2: 'Shift-Ctrl-2',
  toH3: 'Shift-Ctrl-3',
  toH4: 'Shift-Ctrl-4',
  toH5: 'Shift-Ctrl-5',
  toH6: 'Shift-Ctrl-6',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  jumpToStartOfHeading: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  jumpToEndOfHeading: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
  insertEmptyParaBelow: 'Mod-Enter'
};

const name = 'heading';
const levels = [1, 2, 3, 4, 5, 6];
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

const checkIsInHeading = (state: EditorState) => {
  const type = getTypeFromSchema(state.schema);
  return findParentNodeOfType(type)(state.selection);
};
const parseLevel = (levelStr: string | number) => {
  const level = parseInt(levelStr as string, 10);
  return Number.isNaN(level) ? undefined : level;
};
function pluginsFactory(): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    const levelBindings = Object.fromEntries(
      levels.map((level: number) => [keybindings[`toH${level}`], setBlockType(type, { level })])
    );
    return [
      keybindings &&
        keymap({
          ...levelBindings,
          ...createObject([
            [keybindings.moveUp, moveNode(type, 'UP')],
            [keybindings.moveDown, moveNode(type, 'DOWN')],
            [keybindings.jumpToStartOfHeading, jumpToStartOfNode(type)],
            [keybindings.jumpToEndOfHeading, jumpToEndOfNode(type)],
            [keybindings.emptyCopy, copyEmptyCommand(type)],
            [keybindings.emptyCut, cutEmptyCommand(type)],
            [keybindings.insertEmptyParaAbove, insertEmptyParaAbove()],
            [keybindings.insertEmptyParaBelow, insertEmptyParaBelow()]
          ])
        }),
      ...levels.map((level: number) =>
        textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
          level
        }))
      )
    ];
  };
}

export function toggleHeading(level = 3): Command {
  return (state, dispatch) => {
    if (queryIsHeadingActive(level)(state)) {
      return setBlockType(state.schema.nodes.paragraph)(state, dispatch);
    }
    return setBlockType(state.schema.nodes[name], { level })(state, dispatch);
  };
}

export function queryIsHeadingActive(level: number) {
  return (state: EditorState) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(state.selection);
    if (!match) {
      return false;
    }
    const { node } = match;
    if (level == null) {
      return true;
    }
    return node.attrs.level === level;
  };
}

export function insertEmptyParaAbove() {
  return filter(checkIsInHeading, (state, dispatch, view) => {
    return insertEmpty(state.schema.nodes.paragraph, 'above', false)(state, dispatch, view);
  });
}

export function insertEmptyParaBelow() {
  return filter(checkIsInHeading, (state, dispatch, view) => {
    return insertEmpty(state.schema.nodes.paragraph, 'below', false)(state, dispatch, view);
  });
}

export function scrollToHeadingNode({ view, headingSlug }: { view: EditorView; headingSlug: string }) {
  let nodePos: number | undefined;
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && slugify(node.textContent) === headingSlug) {
      nodePos = pos;
      return false;
    }
  });
  if (typeof nodePos === 'number') {
    view.dispatch(
      view.state.tr
        .setSelection(NodeSelection.create(view.state.doc, nodePos))
        // disable floating menu or other tooltips from appearing
        .setMeta('skip-selection-tooltip', true)
    );
    // scroll to top of the heading node
    const domTopPosition = view.coordsAtPos(nodePos).top;
    document.querySelector('.document-print-container')?.scrollTo({ top: domTopPosition });
  }
}

export function getHeadingLink(content: string) {
  const url = new URL(window.location.href);
  url.hash = '';
  const urlWithoutHash = url.toString();
  return `${urlWithoutHash}#${slugify(content)}`;
}
