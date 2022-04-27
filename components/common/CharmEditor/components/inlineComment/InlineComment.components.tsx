import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { ClickAwayListener } from '@mui/material';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { SuggestTooltipPluginKey, SuggestTooltipPluginState, hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../PageThread';

export default function InlineCommentThread ({ showingCommentThreadsList }: {showingCommentThreadsList: boolean}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    component,
    threadId
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;
  const { threads } = useThreads();
  const thread = threadId ? threads[threadId] : null;
  if (isVisible && component === 'inlineComment' && threadId && !thread?.resolved) {
    // Only show comment thread on inline comment if the page threads list is not active
    return !showingCommentThreadsList ? createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
      }}
      >
        <PageThread threadId={threadId} inline />
      </ClickAwayListener>,
      tooltipContentDOM
    ) : null;
  }
  return null;
}
