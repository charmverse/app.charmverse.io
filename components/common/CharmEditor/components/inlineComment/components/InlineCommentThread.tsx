import type { PagePermissionFlags } from '@charmverse/core/permissions';
import styled from '@emotion/styled';
import { Box, ClickAwayListener, Grow, Paper } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import React from 'react';
import { createPortal } from 'react-dom';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { usePageSidebar } from 'hooks/usePageSidebar';
import { useThreads } from 'hooks/useThreads';
import { isTruthy } from 'lib/utilities/types';

import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../../PageThread';
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
  permissions
}: {
  pluginKey: PluginKey<InlineCommentPluginState>;
  permissions?: PagePermissionFlags;
}) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, ids } = usePluginState(pluginKey) as InlineCommentPluginState;
  const { threads } = useThreads();

  const { activeView } = usePageSidebar();
  // Find unresolved threads in the thread ids and sort them based on desc order of createdAt
  const unResolvedThreads = ids
    .map((threadId) => threads[threadId])
    .filter((thread) => thread && !thread?.resolved)
    .filter(isTruthy)
    .sort((threadA, threadB) =>
      threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
    );

  if ((activeView !== 'comments' || permissions) && isVisible && unResolvedThreads.length !== 0) {
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
                  permissions={permissions}
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
