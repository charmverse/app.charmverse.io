import { Decoration, DecorationSet, Plugin, Selection } from '@bangle.dev/pm';
import type { EditorState, PluginKey } from '@bangle.dev/pm';
import { RateReviewOutlined } from '@mui/icons-material';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import reactDOM from 'react-dom';
import { renderSuggestionsTooltip, referenceElement } from '../@bangle.dev/tooltip/suggest-tooltip';
import { getEventsFromDoc } from './getEvents';
import { trackPlugin } from './statePlugins/track';
import { RowDecoration } from '../inlineComment/components/InlineCommentRowDecoration';

export interface SuggestionPluginState {
  tooltipContentDOM: HTMLElement;
  show: boolean;
  // use pos because we can't generate unique ids for marks - they are merged automatically by PM when calling addMark(), UNLESS there are any unique properties
  pos?: string;
}

export function plugins ({ onSelectionSet, key, readOnly, userId, username }:
    { onSelectionSet?: (state: EditorState) => void, readOnly: boolean, key: PluginKey, userId: string, username: string }) {

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
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            pos: undefined
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
              show: false,
              pos: undefined
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
            renderSuggestionsTooltip(key, {})(view.state, view.dispatch, view);
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
          const iconContainer = (event.target as HTMLElement)?.closest('.charm-row-decoration-suggestions');
          const suggestionPos = iconContainer?.getAttribute('data-pos');
          if (suggestionPos) {
            const { tr } = view.state;
            const selectedPos = parseInt(suggestionPos, 0) + 1;
            tr.setSelection(Selection.near(tr.doc.resolve(selectedPos)));
            view.dispatch(tr);
            renderSuggestionsTooltip(key, { pos: suggestionPos })(view.state, view.dispatch, view);
            return true;
          }
          return false;
        }
      }
    })
  ];
}

function getDecorations (state: EditorState) {

  const rows = getEventsFromDoc({ state });
  const decorations: Decoration[] = rows.map(row => {
    // inject decoration at the start of the paragraph/header
    const firstPos = row.pos + 1;
    return Decoration.widget(firstPos, () => renderComponent({ pos: row.pos }), { key: firstPos.toString() });
  });

  return DecorationSet.create(state.doc, decorations);
}

function renderComponent ({ pos }: { pos: number }) {

  // const ids = nodesWithMark.map(node => node.marks[0]?.attrs.id).filter(Boolean);

  const container = document.createElement('div');
  container.className = 'charm-row-decoration-suggestions charm-row-decoration';
  container.setAttribute('data-pos', pos.toString());
  reactDOM.render(<RowDecoration count={1} icon={RateReviewOutlined} />, container);

  return container;
}
