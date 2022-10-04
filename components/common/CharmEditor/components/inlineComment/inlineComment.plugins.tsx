import type { RawPlugins } from '@bangle.dev/core';
import { Plugin } from '@bangle.dev/core';
import type { PluginKey, EditorState, EditorView, Node, Schema } from '@bangle.dev/pm';
import { Decoration, DecorationSet } from '@bangle.dev/pm';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import reactDOM from 'react-dom';

import { extractInlineCommentRows } from 'lib/inline-comments/findTotalInlineComments';
import { highlightMarkedElement, highlightElement } from 'lib/prosemirror/highlightMarkedElement';

import { referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';

import RowDecoration from './components/InlineCommentRowDecoration';
import { markName } from './inlineComment.constants';

export interface InlineCommentPluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
  ids: string[];
}

export function plugin ({ key } :{
  key: PluginKey;
}): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineCommentPluginState>({
      state: {
        init () {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            ids: []
          };
        },
        apply (tr, pluginState) {
          const meta = tr.getMeta(key);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              ...meta.value,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            // Do not change object reference if show was and is false
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              ids: [],
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      key,
      props: {
        handleClickOn: (view: EditorView, pos: number, node, nodePos, event: MouseEvent) => {
          const className = (event.target as HTMLElement).className + ((event.target as HTMLElement).parentNode as HTMLElement).className;
          if (/charm-inline-comment/.test(className)) {
            return highlightMarkedElement({
              view,
              elementId: 'page-action-sidebar',
              key,
              markName,
              prefix: 'thread'
            });
          }
          return false;
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: key,
      renderOpts: {
        placement: 'bottom',
        tooltipDOMSpec,
        getReferenceElement: referenceElement(key, (state) => {
          const { selection } = state;
          return {
            end: selection.to,
            start: selection.from
          };
        })
      }
    }),
    // a plugin to display icons to the right of each paragraph and header
    new Plugin({
      state: {
        init (_, { doc, schema }) {
          return getDecorations({ schema, doc });
        },
        apply (tr, old, _, editorState) {
          return tr.docChanged ? getDecorations({ schema: editorState.schema, doc: tr.doc }) : old;
        }
      },
      props: {
        decorations (state: EditorState) {
          return this.getState(state);
        },
        handleClickOn: (view: EditorView, pos: number, node, nodePos, event: MouseEvent) => {
          const inlineCommentContainer = (event.target as HTMLElement)?.closest('.charm-row-decoration-comments');
          const ids = inlineCommentContainer?.getAttribute('data-ids')?.split(',') || [];
          if (ids.length > 0) {
            return highlightElement({
              ids,
              view,
              elementId: 'page-action-sidebar',
              key,
              markName,
              prefix: 'thread'
            });
          }
          return false;
        }
      }
    })
  ];
}

function getDecorations ({ schema, doc }: { doc: Node, schema: Schema }) {
  const rows = extractInlineCommentRows(schema, doc);
  const uniqueCommentIds: Set<string> = new Set();

  const decorations: Decoration[] = [];

  rows.forEach(row => {
    // inject decoration at the start of the paragraph/header
    const firstPos = row.pos + 1;
    const commentIds = row.nodes.map(node => node.marks[0]?.attrs.id).filter(Boolean);
    const newIds = commentIds.filter(commentId => !uniqueCommentIds.has(commentId));
    commentIds.forEach(commentId => uniqueCommentIds.add(commentId));

    if (newIds.length !== 0) {
      const container = document.createElement('div');
      container.className = 'charm-row-decoration-comments charm-row-decoration';
      container.setAttribute('data-ids', newIds.join(','));
      reactDOM.render(<RowDecoration count={newIds.length} />, container);

      decorations.push(Decoration.widget(firstPos, () => container, { key: commentIds.join(',') }));
    }
  });

  return DecorationSet.create(doc, decorations);
}
