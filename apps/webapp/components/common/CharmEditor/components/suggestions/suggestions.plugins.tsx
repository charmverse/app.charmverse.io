import { RateReviewOutlined } from '@mui/icons-material';
import { renderSuggestionsTooltip } from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import { Plugin, Selection } from 'prosemirror-state';
import type { EditorState, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createRoot } from 'react-dom/client';

import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import { referenceElement } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import { plugins as tooltipPlacementPlugins } from '../@bangle.dev/tooltip/tooltipPlacement';
import { RowDecoration } from '../inlineComment/components/InlineCommentRowDecoration';

import { getEventsFromDoc } from './getEvents';

export interface SuggestionPluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
  // use pos because we can't generate unique ids for marks - they are merged automatically by PM when calling addMark(), UNLESS there are any unique properties
  rowPos?: number;
}

export function plugins({ onSelectionSet, key }: { onSelectionSet?: (state: EditorState) => void; key: PluginKey }) {
  const tooltipDOMSpec = createTooltipDOM();

  return [
    // this plugin emits the changes/new state from the origianl trackPlugin, which allows the sidebar to update
    new Plugin({
      state: {
        init() {
          return false;
        },
        apply(tr, prev, oldState, state) {
          // react to when something is clicked, or when a selection is set by the sidebar component
          if (tr.selectionSet || oldState.selection.eq(state.selection)) {
            onSelectionSet?.(state);
          }
          return prev;
        }
      }
    }),
    new Plugin<SuggestionPluginState>({
      key,
      state: {
        init() {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            rowPos: undefined
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
              rowPos: undefined
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleClickOn: (view, pos: number, node, nodePos, event: MouseEvent) => {
          const isSuggestion =
            /^(insertion|deletion|format-change)/.test((event.target as HTMLElement).className) ||
            /^(insertion|deletion|format-change)/.test(
              ((event.target as HTMLElement).parentNode as HTMLElement).className
            ) ||
            /^(insertion|deletion|format-change)/.test((event.target as any).parentNode?.parentNode?.className);
          if (isSuggestion) {
            renderSuggestionsTooltip(key, {})(view.state, view.dispatch, view);
            return true;
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
        apply(tr, old, _, editorState) {
          // listen for 'track' event so that we update the decorations
          return tr.docChanged ? getDecorations(editorState) : old;
        }
      },
      props: {
        decorations(state: EditorState) {
          return this.getState(state);
        },
        handleClickOn: (view, pos: number, node, nodePos, event) => {
          const widgetContainer = (event.target as HTMLElement)?.closest('.charm-row-decoration-suggestions');
          const markPos = widgetContainer?.getAttribute('data-mark-pos');
          const rowPos = widgetContainer?.getAttribute('data-pos');
          if (rowPos && markPos) {
            const { tr } = view.state;
            // set a selection based on the first mark so the tooltip appears in the correct place
            // Note: for some reason this doesn't work well if the first mark is the top parent; the popup appears in the middle of the editor
            const markPosInt = parseInt(markPos, 10);
            // use rowPos so that the suggestions popup can grab all related suggestions
            const rowPosInt = parseInt(rowPos, 10);
            tr.setSelection(Selection.near(tr.doc.resolve(markPosInt)));
            view.dispatch(tr);
            renderSuggestionsTooltip(key, { rowPos: rowPosInt })(view.state, view.dispatch, view);
            return true;
          }
          return false;
        }
      }
    })
  ];
}

function getDecorations(state: EditorState) {
  const rows = getEventsFromDoc({ state });
  const decorations: Decoration[] = rows.map((row) => {
    // inject decoration at the start of the paragraph/header
    const widgetPos = row.pos + 1;
    const firstMarkPos = row.marks[0].pos;
    return Decoration.widget(
      widgetPos,
      () =>
        renderComponent({
          rowPos: row.pos,
          firstMarkPos,
          count: row.marks.length
        }),
      { key: widgetPos.toString(), side: -1 }
    );
  });

  return DecorationSet.create(state.doc, decorations);
}

function renderComponent({ rowPos, firstMarkPos, count }: { rowPos: number; firstMarkPos: number; count: number }) {
  const container = document.createElement('div');
  container.className = 'charm-row-decoration-suggestions charm-row-decoration';
  container.setAttribute('data-pos', rowPos.toString());
  container.setAttribute('data-mark-pos', firstMarkPos.toString());
  createRoot(container).render(<RowDecoration count={count} icon={RateReviewOutlined} />);

  return container;
}
