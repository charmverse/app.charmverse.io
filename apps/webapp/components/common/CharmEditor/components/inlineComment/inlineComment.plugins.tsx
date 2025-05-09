import { markName } from '@packages/bangleeditor/components/inlineComment/inlineComment.constants';
import type { EditorState, PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createRoot } from 'react-dom/client';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { highlightMarkedElement, highlightElement } from 'lib/prosemirror/highlightMarkedElement';
import { extractInlineCommentRows } from 'lib/prosemirror/plugins/inlineComments/findTotalInlineComments';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import { referenceElement } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import { plugins as tooltipPlacementPlugins } from '../@bangle.dev/tooltip/tooltipPlacement';
import { threadPluginKey } from '../thread/thread.plugins';

import RowDecoration from './components/InlineCommentRowDecoration';

export interface InlineCommentPluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
  ids: string[];
}

export function plugin({ key }: { key: PluginKey }): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineCommentPluginState>({
      state: {
        init() {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            ids: []
          };
        },
        apply(tr, pluginState) {
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
          const domNode = view.domAtPos(pos);
          const className = domNode.node.parentElement?.className ?? '';
          if (className.includes('active') && className.includes('charm-thread-comment')) {
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
    tooltipPlacementPlugins({
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
        init(_, state) {
          return getDecorations(state);
        },
        apply(tr, old, _, newState) {
          return tr.docChanged ? getDecorations(newState) : old;
        }
      },
      props: {
        decorations(state: EditorState) {
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

function getDecorations(state: EditorState) {
  const threadIds = threadPluginKey.getState(state) ?? [];
  const rows = extractInlineCommentRows(state.schema, state.doc, threadIds);
  const uniqueThreadIds: Set<string> = new Set();
  const decorations: Decoration[] = [];

  rows.forEach((row) => {
    // inject decoration at the start of the paragraph/header
    const firstPos = row.pos + 1;
    const commentIds = row.nodes
      .map((node) => node.marks.find((mark) => mark.type.name === 'inline-comment')?.attrs.id)
      .filter(Boolean);
    const newIds = Array.from(new Set(commentIds.filter((commentId) => !uniqueThreadIds.has(commentId))));
    commentIds.forEach((commentId) => uniqueThreadIds.add(commentId));

    if (newIds.length !== 0) {
      const container = document.createElement('div');
      container.className = 'charm-row-decoration-comments charm-row-decoration';
      container.setAttribute('data-ids', newIds.join(','));
      container.setAttribute('data-test', 'charmverse-inline-comment-icon');
      createRoot(container).render(<RowDecoration count={newIds.length} />);

      decorations.push(Decoration.widget(firstPos, () => container, { key: commentIds.join(',') }));
    }
  });

  return DecorationSet.create(state.doc, decorations);
}
