import { Plugin, RawPlugins } from '@bangle.dev/core';
import { TextSelection } from '@bangle.dev/pm';
import { highlightDomElement } from 'lib/dom/highlight';
import { renderSuggestionsTooltip, SuggestTooltipPluginKey } from '../@bangle.dev/tooltip/suggest-tooltip';

export function plugin (): RawPlugins {
  return [
    new Plugin({
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
            const inlineCommentMark = view.state.doc.type.schema.marks['inline-comment'].isInSet(fromNodeAfter.marks);
            const pageThreadListNode = document.querySelector('.PageThreadListBox') as HTMLDivElement;
            // Page threads list node might not be present
            const isShowingCommentThreadsList = pageThreadListNode.style.visibility !== 'hidden';

            const threadId = inlineCommentMark?.attrs.id;
            if (threadId) {
              // If we are showing the thread list on the right, then navigate to the appropriate thread and highlight it
              if (isShowingCommentThreadsList) {
                // Use regular dom methods as we have no access to a ref inside a plugin
                // Plus this is only a cosmetic change which doesn't impact any of the state
                const threadDocument = document.getElementById(`thread.${threadId}`);
                if (threadDocument) {
                  highlightDomElement(threadDocument);
                }
              }
              else {
                // If the page thread list isn't open, then we need to show the inline thread component
                renderSuggestionsTooltip(SuggestTooltipPluginKey, {
                  component: 'inlineComment',
                  threadIds: [threadId]
                })(view.state, view.dispatch, view);
              }
            }
          }
          return true;
        }
      }
    })
  ];
}
