import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import { NodeView } from '@bangle.dev/core';
import type { DOMOutputSpec, EditorState, EditorView, Transaction } from '@bangle.dev/pm';
import { chainCommands, createParagraphNear, keymap, newlineInCode, splitBlock } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject, filter, insertEmpty } from '@bangle.dev/utils';

import log from 'lib/log';

export function rowSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnLayout',
    schema: {
      attrs: {
        track: {
          default: []
        }
      },
      content: 'columnBlock+',
      isolating: true,
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column-row' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-column-row' }];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {

        /*
        An approach to generating columns would be to have a single-row markdown table.
        For this to work, we need to find a way to replace all the whitepace in the inner nodes with a <br> tag

        See MarkdownSerialiserState implementation here
        https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/to_markdown.js

        node.forEach(column => {
          // Calls serialisers for each content node
          state.renderInline(column);
        });
        */

      }
    }
  };
}

export function columnSpec (): RawSpecs {
  return {
    type: 'node',
    name: 'columnBlock',
    schema: {
      isolating: true,
      content: 'block*',
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-column' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-column', 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        log.warn('Column triggered but no markdown support', node);
      }
    }
  };
}

export function plugins (): RawPlugins {
  return ({ schema }) => {

    const isColumnBlock = parentHasDirectParentOfType(schema.nodes.columnBlock, schema.nodes.columnLayout);

    return [
      keymap(
        createObject([
          // 'Shift-Tab': undentListItem,
          ['Tab', filter(isColumnBlock, (state, dispatch) => {
            // if (dispatch) {
            //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
            // }
            return false;
          })],
          // 'Shift-Tab': undentListItem,
          ['Mod-Enter', filter(isColumnBlock, exitColumn)],
          ['Enter', filter(isColumnBlock, chainCommands(newlineInCode, createParagraphNear, splitBlock))]
        ])
      ),
      NodeView.createPlugin({
        name: 'columnLayout',
        containerDOM: ['div', { class: 'charm-column' }],
        contentDOM: ['div']
      }),
      NodeView.createPlugin({
        name: 'columnBlock',
        containerDOM: ['div', { class: 'charm-column-row' }],
        contentDOM: ['div']
      })
    ];
  };
}
function exitColumn (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, view: EditorView<any> | undefined) {
  return insertEmpty(state.schema.nodes.paragraph, 'below', true)(state, dispatch, view);
}
