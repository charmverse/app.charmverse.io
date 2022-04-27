import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, ClickAwayListener } from '@mui/material';
import { useThreadsDisplay } from 'components/common/PageLayout/PageLayout';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { SuggestTooltipPluginKey, SuggestTooltipPluginState, hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../PageThread';

const ThreadContainerBox = styled(Box)`
  max-height: 400px;
  overflow: auto;
  display: flex;
  gap: 1;
  flex-direction: column;
  min-width: 500px;
`;

export default function InlineCommentThread () {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    component,
    threadIds
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;
  const { threads } = useThreads();

  const { showingCommentThreadsList } = useThreadsDisplay();
  const unResolvedThreads = threadIds.map(threadId => threads[threadId]).filter(thread => !thread?.resolved);
  if (isVisible && component === 'inlineComment' && unResolvedThreads.length !== 0) {
    // Only show comment thread on inline comment if the page threads list is not active
    return !showingCommentThreadsList ? createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
      }}
      >
        <ThreadContainerBox>
          {unResolvedThreads.map(resolvedThread => resolvedThread
            && <PageThread inline={false} key={resolvedThread.id} threadId={resolvedThread?.id} />)}
        </ThreadContainerBox>
      </ClickAwayListener>,
      tooltipContentDOM
    ) : null;
  }
  return null;
}
