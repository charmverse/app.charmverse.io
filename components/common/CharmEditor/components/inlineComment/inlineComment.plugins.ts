import { Plugin, RawPlugins } from '@bangle.dev/core';
import { PluginKey, TextSelection } from '@bangle.dev/pm';
import { createTooltipDOM, tooltipPlacement } from '@bangle.dev/tooltip';
import { highlightDomElement } from 'lib/browser';
import { referenceElement, renderSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import { markName } from '../inlineComment/inlineComment.constants';

export interface InlineCommentPluginState {
  tooltipContentDOM: HTMLElement
  show: boolean
  threadIds: string[]
}

export function plugin ({ key } :{
  key: PluginKey
}): RawPlugins {
  const tooltipDOMSpec = createTooltipDOM();
  return [
    new Plugin<InlineCommentPluginState>({
      state: {
        init () {
          return {
            show: false,
            tooltipContentDOM: tooltipDOMSpec.contentDOM,
            threadIds: []
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
              threadIds: [],
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      key,
      props: {
        handleClickOn: (view) => {
          const { $from, $to } = view.state.selection;
          const fromNodeAfter = $from.nodeAfter;
          const toNodeAfter = $to.nodeAfter;
          if (!toNodeAfter) {
            const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
            view.dispatch(tr);
            return true;
          }
          if (fromNodeAfter) {
            const inlineCommentMark = view.state.doc.type.schema.marks[markName].isInSet(fromNodeAfter.marks);
            const pageThreadListNode = document.querySelector('.PageThreadListBox') as HTMLDivElement;
            // Page threads list node might not be present
            const isShowingCommentThreadsList = pageThreadListNode.style.visibility !== 'hidden';
            // Check if we are inside a card page modal
            const cardId = (new URLSearchParams(window.location.href)).get('cardId');
            const threadId = inlineCommentMark?.attrs.id;
            if (threadId) {
              // If we are showing the thread list on the right, then navigate to the appropriate thread and highlight it
              if (isShowingCommentThreadsList && !cardId) {
                // Use regular dom methods as we have no access to a ref inside a plugin
                // Plus this is only a cosmetic change which doesn't impact any of the state
                const threadDocument = document.getElementById(`thread.${threadId}`);
                if (threadDocument) {
                  highlightDomElement(threadDocument);
                }
              }
              else {
                // If the page thread list isn't open, then we need to show the inline thread component
                renderSuggestionsTooltip(key, {
                  threadIds: [threadId]
                })(view.state, view.dispatch, view);
              }
            }
          }
          return true;
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
    })
  ];
}
