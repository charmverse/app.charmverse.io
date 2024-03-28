import type { Command, EditorState, Node, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { keymap, NodeSelection, setBlockType, textblockTypeInputRule } from '@bangle.dev/pm';
import {
  copyEmptyCommand,
  cutEmptyCommand,
  jumpToEndOfNode,
  jumpToStartOfNode,
  moveNode
} from '@bangle.dev/pm-commands';
import { selectionTooltip } from '@bangle.dev/tooltip';
import { browser, filter, findParentNodeOfType, insertEmpty, createObject } from '@bangle.dev/utils';
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import { slugify } from 'lib/utils/strings';

import type { BangleEditor } from './@bangle.dev/core/bangle-editor';

export const spec = specFactory;
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
function specFactory(): RawSpecs {
  if (levels.some((r) => typeof r !== 'number')) {
    throw new Error('levels must be number');
  }

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        id: {
          // id is used for linking from table of contents
          default: null
        },
        level: {
          default: 1
        },
        track: {
          default: []
        }
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: levels.map((level) => {
        return {
          tag: `h${level}`,
          getAttrs: (dom: any) => {
            const result = { level: parseLevel(level) };
            const attrs = dom.getAttribute('data-bangle-attrs');
            if (!attrs) {
              return result;
            }

            const obj = JSON.parse(attrs);

            return { ...result, ...obj };
          }
        };
      }),
      toDOM: (node: Node) => {
        const result: any = [`h${node.attrs.level}`, { id: node.attrs.id }, 0];

        return result;
      }
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.write(`${state.repeat('#', node.attrs.level)} `);
        state.renderInline(node);
        state.closeBlock(node);
      },
      parseMarkdown: {
        heading: {
          block: name,
          getAttrs: (tok: Token) => {
            return { level: parseLevel(tok.tag.slice(1)) };
          }
        }
      }
    }
  };
}

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

export function scrollIntoHeadingNode({ editor, pluginKey }: { editor: BangleEditor; pluginKey: PluginKey }) {
  const hash = window.location.hash.slice(1);

  if (hash) {
    let nodePos: number | undefined;
    editor.view.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && slugify(node.textContent) === hash) {
        nodePos = pos;
        return false;
      }
    });

    const domNode = nodePos ? (editor.view.domAtPos(nodePos)?.node as HTMLElement) : null;
    if (domNode && nodePos !== undefined) {
      editor.view.dispatch(editor.view.state.tr.setSelection(NodeSelection.create(editor.view.state.doc, nodePos)));
      setTimeout(() => {
        selectionTooltip.hideSelectionTooltip(pluginKey)(editor.view.state, editor.view.dispatch, editor.view);
        // Need to get the dom node again because the node might have been re-rendered
        (editor.view.domAtPos(nodePos!)?.node as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    }
  }
}
