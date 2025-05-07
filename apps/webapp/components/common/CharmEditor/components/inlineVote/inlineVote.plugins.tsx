import type { Node, Schema } from 'prosemirror-model';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createRoot } from 'react-dom/client';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { highlightMarkedElement } from 'lib/prosemirror/highlightMarkedElement';
import { extractInlineVoteRows } from 'lib/prosemirror/plugins/inlineVotes/findTotalInlineVotes';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import { referenceElement } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import { plugins as tooltipPlacementPlugins } from '../@bangle.dev/tooltip/tooltipPlacement';

import RowDecoration from './components/InlineVoteRowDecoration';
import { markName } from './inlineVote.constants';

export interface InlineVotePluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
  ids: string[];
}

export function plugin({ key }: { key: PluginKey }): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineVotePluginState>({
      key,
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
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              show: false,
              ids: []
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleClickOn: (view: EditorView, _, __, ___, event: MouseEvent) => {
          const className =
            (event.target as HTMLElement).className +
            ((event.target as HTMLElement).parentNode as HTMLElement).className;
          if (/inline-vote/.test(className)) {
            return highlightMarkedElement({
              view,
              elementId: 'page-action-sidebar',
              key,
              markName,
              prefix: 'vote'
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
        init(_, { doc, schema }) {
          return getDecorations({ schema, doc });
        },
        apply(tr, old, _, editorState) {
          return tr.docChanged ? getDecorations({ schema: editorState.schema, doc: tr.doc }) : old;
        }
      },
      props: {}
    })
  ];
}

function getDecorations({ schema, doc }: { doc: Node; schema: Schema }) {
  const rows = extractInlineVoteRows(schema, doc);
  const decorations: Decoration[] = rows.map((row) => {
    // inject decoration at the start of the paragraph/header
    const firstPos = row.pos + 1;
    return Decoration.widget(firstPos, () => renderComponent(row.nodes), {
      key: firstPos.toString() + row.nodes.length
    });
  });

  return DecorationSet.create(doc, decorations);
}

function renderComponent(nodesWithMark: Node[]) {
  const ids = nodesWithMark.map((node) => node.marks[0]?.attrs.id).filter(Boolean);

  const container = document.createElement('div');
  container.className = 'charm-row-decoration-votes charm-row-decoration';
  container.setAttribute('data-ids', ids.join(','));
  createRoot(container).render(<RowDecoration count={ids.length} />);

  return container;
}
