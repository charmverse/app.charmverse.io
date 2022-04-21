import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { SuggestTooltipPluginKey, SuggestTooltipPluginState } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggest-tooltip';

export function useInlineComment () {
  const view = useEditorViewContext();
  const {
    threadId
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;

  return {
    removeInlineCommentMark () {
      if (threadId) {
        const [from, to] = [view.state.selection.$from.start(), view.state.selection.$to.end()];
        const inlineCommentMark = view.state.schema.marks['inline-comment'];
        const tr = view.state.tr.removeMark(from, to, inlineCommentMark);
        if (view.dispatch) {
          view.dispatch(tr);
        }
      }
    }
  };
}
