import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import { Box, ClickAwayListener, Grow, Paper } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { createPortal } from 'react-dom';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { useThreads } from 'hooks/useThreads';
import { isTruthy } from 'lib/utilities/types';

import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../../thread/PageThread';
import type { InlineCommentPluginState } from '../inlineComment.plugins';

export const ThreadContainer = styled(Paper)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: column;
  overflow: auto;
  width: calc(100vw - ${({ theme }) => theme.spacing(1)});
  margin: ${({ theme }) => theme.spacing(0.5)};
  max-height: 60vh;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: 100%;
    min-width: 500px;
    max-height: 400px;
  }
`;

export function InlineCommentThread({
  pluginKey,
  permissions,
  isCommentSidebarOpen
}: {
  pluginKey: PluginKey<InlineCommentPluginState>;
  permissions?: PagePermissionFlags;
  isCommentSidebarOpen: boolean;
}) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, ids } = usePluginState(pluginKey) as InlineCommentPluginState;
  const { threads } = useThreads();

  // Find unresolved threads in the thread ids and sort them based on desc order of createdAt
  const unResolvedThreads = ids
    .map((threadId) => threads[threadId])
    .filter((thread) => thread && !thread?.resolved)
    .filter(isTruthy)
    .sort((threadA, threadB) =>
      threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
    );

  if ((!isCommentSidebarOpen || permissions) && isVisible && unResolvedThreads.length !== 0) {
    // Only show comment thread on inline comment if the page threads list is not active
    return createPortal(
      <ClickAwayListener
        onClickAway={() => {
          hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
        }}
      >
        <Grow
          in
          style={{
            transformOrigin: 'left top'
          }}
          easing={{
            enter: 'ease-in-out'
          }}
          timeout={250}
        >
          <Box display='flex' flexDirection='column' gap={1}>
            {unResolvedThreads.map((resolvedThread) => (
              <ThreadContainer key={resolvedThread.id} elevation={4}>
                <PageThread
                  canCreateComments={permissions?.comment}
                  inline={ids.length === 1}
                  key={resolvedThread.id}
                  threadId={resolvedThread?.id}
                />
              </ThreadContainer>
            ))}
          </Box>
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}
