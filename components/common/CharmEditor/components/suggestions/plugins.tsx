import { Decoration, DecorationSet, Plugin } from '@bangle.dev/pm';
import type { EditorState, PluginKey } from '@bangle.dev/pm';
import { RateReviewOutlined } from '@mui/icons-material';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import reactDOM from 'react-dom';
import { renderSuggestionsTooltip, referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';
import { getTracksFromDoc } from './track/getTracks';
import { trackPlugin } from './statePlugins/track';
import { RowDecoration } from '../inlineComment/components/InlineCommentRowDecoration';

export interface SuggestionPluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
}

export function plugins ({ onSelectionSet, key, userId, username }:
    { onSelectionSet?: (state: EditorState) => void, key: PluginKey, userId: string, username: string }) {

  const tooltipDOMSpec = createTooltipDOM();

  return [
    trackPlugin({ userId, username }),
    // this plugin emits the changes/new state from the origianl trackPlugin, which allows the sidebar to update
    new Plugin({
      state: {
        init () {
          return false;
        },
        apply (tr, prev, oldState, state) {
          // react to when something is clicked
          if (tr.selectionSet && onSelectionSet) {
            onSelectionSet(state);
          }
          return prev;
        }
      }
    }),
    new Plugin<SuggestionPluginState>({
      key,
      state: {
        init () {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM
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
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleClickOn: (view, pos: number, node, nodePos, event: MouseEvent) => {

          const isSuggestion = /^(insertion|deletion|format-change)/.test((event.target as HTMLElement).className)
            || /^(insertion|deletion|format-change)/.test(((event.target as HTMLElement).parentNode as HTMLElement).className)
            || /^(insertion|deletion|format-change)/.test((event.target as any).parentNode?.parentNode?.className);
          if (isSuggestion) {
            renderSuggestionsTooltip(key, {
              pos
            })(view.state, view.dispatch, view);
            return true;
            // return highlightMarkedElement({
            //   view,
            //   elementId: 'page-suggestion-list-box',
            //   key,
            //   markName: 'insertion',
            //   prefix: 'suggestion'
            // });
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
        init (_, state) {
          return getDecorations(state);
        },
        apply (tr, old, _, editorState) {
          return tr.docChanged ? getDecorations(editorState) : old;
        }
      },
      props: {
        decorations (state: EditorState) {
          return this.getState(state);
        },
        handleClickOn: (view, pos: number, node, nodePos, event) => {
          const inlineCommentContainer = (event.target as HTMLElement)?.closest('.charm-row-decoration-suggestions');
          const ids = inlineCommentContainer?.getAttribute('data-ids')?.split(',') || [];
          if (ids.length > 0) {
            renderSuggestionsTooltip(key, {})(view.state, view.dispatch, view);
            return true;
            // return highlightElement({
            //   ids,
            //   view,
            //   elementId: 'page-suggestion-list-box',
            //   key,
            //   markName: 'insertion',
            //   prefix: 'suggestion'
            // });
          }
          return false;
        }
      }
    })
  ];
}

function getDecorations (state: EditorState) {

  const rows = getTracksFromDoc({ state });
  const decorations: Decoration[] = rows.map(row => {
    // inject decoration at the start of the paragraph/header
    const firstPos = row.pos + 1;
    return Decoration.widget(firstPos, () => renderComponent(), { key: firstPos.toString() });
  });

  return DecorationSet.create(state.doc, decorations);
}

function renderComponent () {

  // const ids = nodesWithMark.map(node => node.marks[0]?.attrs.id).filter(Boolean);

  const container = document.createElement('div');
  container.className = 'charm-row-decoration-suggestions charm-row-decoration';
  // container.setAttribute('data-ids', ids.join(','));
  reactDOM.render(<RowDecoration count={1} icon={RateReviewOutlined} />, container);

  return container;
}
