import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import { NodeView, createElement } from '@bangle.dev/core';
import { chainCommands, createParagraphNear, keymap, newlineInCode, splitBlock } from '@bangle.dev/pm';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { createObject, filter, insertEmpty, getNodeType } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';
import { ColumnResizer } from '@column-resizer/core';
import type { DOMOutputSpec } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorState, Transaction } from 'prosemirror-state';
import { findChildrenByType } from 'prosemirror-utils';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { EditorView } from 'prosemirror-view';

export function rowSpec(): RawSpecs {
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
        return ['div', { class: 'charm-column-row' }, 0];
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

export function columnSpec(): RawSpecs {
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
        return ['div', { class: 'charm-column', 'data-item-type': 'SECTION' }, 0];
      }
    },
    markdown: {
      toMarkdown: (state, node) => {
        log.warn('Column triggered but no markdown support', node);
      }
    }
  };
}

const resizeBarPlugin = new Plugin({
  state: {
    init(_, state) {
      return buildResizeBars(state);
    },
    apply(tr, old, oldState, newState) {
      // For performance only build the
      // decorations if the doc has actually changed
      return tr.docChanged ? buildResizeBars(newState) : old;
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

export function plugins(): RawPlugins {
  return ({ schema }) => {
    const isColumnBlock = parentHasDirectParentOfType(schema.nodes.columnBlock, schema.nodes.columnLayout);

    return [
      keymap(
        createObject([
          // 'Shift-Tab': undentListItem,
          [
            'Tab',
            filter(isColumnBlock, (state, dispatch) => {
              // if (dispatch) {
              //   dispatch(state.tr.replaceSelectionWith(state.schema.nodes.tabIndent.create()).scrollIntoView());
              // }
              return false;
            })
          ],
          // 'Shift-Tab': undentListItem,
          ['Mod-Enter', filter(isColumnBlock, exitColumn)],
          ['Enter', filter(isColumnBlock, chainCommands(newlineInCode, createParagraphNear, splitBlock))]
        ])
      ),
      // colLayoutPlugin
      resizeBarPlugin,
      NodeViewPlugin({
        name: 'columnLayout',
        contentDOM: ['div', { class: 'charm-column-row' }]
      }),
      NodeView2Plugin({
        name: 'columnBlock',
        contentDOM: ['div', { class: 'charm-column', 'data-item-type': 'SECTION' }]
      })
      // NodeView.createPlugin({
      //   name: 'columnBlock',
      //   containerDOM: ['div', { class: 'charm-column' }],
      //   contentDOM: ['div']
      // })
    ];
  };
}

function exitColumn(
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  view: EditorView | undefined
) {
  return insertEmpty(state.schema.nodes.paragraph, 'below', true)(state, dispatch, view);
}

function buildResizeBars(state: EditorState) {
  const nodeType = getNodeType(state, 'columnLayout');
  const rowNodes = findChildrenByType(state.doc, nodeType);
  const columnPoses = rowNodes
    .map((row) => {
      // Remove the first column since it does not need a resize bar
      const [, ...columns] = findChildrenByType(row.node, getNodeType(state, 'columnBlock'));
      return columns.map((column) => column.pos + row.pos);
    })
    .flat();

  // See https://prosemirror.net/docs/ref/#view.Decoration^widget
  return DecorationSet.create(
    state.doc,
    // Create a decoration for each heading that is collapsible
    columnPoses.map((columnPos) =>
      Decoration.widget(
        columnPos + 1,
        (view, getPos) => {
          return createElement(['div', { class: 'charm-column-bar', 'data-item-type': 'BAR' }, ['div', ['div']]]);
        },
        // render deco before cursor
        { side: -1 }
      )
    )
  );
}

function NodeViewPlugin({ name, contentDOM }: { name: string; contentDOM: DOMOutputSpec }) {
  return new Plugin({
    key: new PluginKey(`${name}-NodeView`),
    props: {
      nodeViews: {
        [name]: function nodeView(node, view) {
          // @ts-ignore
          const element = createElement(contentDOM);

          const columnResizer = new ColumnResizer({ vertical: false });
          // setTimeout(() => {
          //   console.log('init resizer');
          //   columnResizer.init(element);
          // });
          setTimeout(() => {
            columnResizer.init(element);
          });

          return {
            contentDOM: element,
            dom: element,
            update(newNode) {
              // check if updated is node
              if (!node.sameMarkup(newNode)) return false;
              // console.log('children', node.chil);
              // const empty = newNode.content.length == 0;
              // const oldEmpty = this.node.content.length == 0;
              // if (empty && !oldEmpty) this.dom.classList.add('empty-class');
              // else if (!empty && oldEmpty) this.dom.classList.remove('empty-class');
              // this.node = newNode;
              return true;
            },
            ignoreMutation(mutation) {
              if ((mutation as MutationRecord).attributeName === 'open') {
                return true;
              }
              return true;
              return false;
            },
            node,
            view,
            destroy() {
              columnResizer.dispose();
            }
          };
        }
      }
    }
  });
}
function NodeView2Plugin({ name, contentDOM }: { name: string; contentDOM: DOMOutputSpec }) {
  return new Plugin({
    key: new PluginKey(`${name}-NodeView`),
    props: {
      nodeViews: {
        [name]: function nodeView(node, view) {
          const element = createElement(contentDOM);

          return {
            contentDOM: element,
            dom: element,
            node,
            view,
            ignoreMutation(mutation) {
              return true;
            },
            update(newNode, decorations) {
              if (!node.sameMarkup(newNode)) return false;
              return true;
            }
          };
        }
      }
    }
  });
}
