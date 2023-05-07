import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { selectionTooltip } from '@bangle.dev/tooltip';
import styled from '@emotion/styled';
import SendIcon from '@mui/icons-material/Send';
import type { Theme } from '@mui/material';
import { Box, Button, ClickAwayListener, Grow, Paper, useMediaQuery } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useInlineComment } from 'hooks/useInlineComment';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { useThreads } from 'hooks/useThreads';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../PageThread';

import type { InlineCommentPluginState } from './inlineComment.plugins';
import { updateInlineComment } from './inlineComment.utils';

const hideSelectionTooltip = selectionTooltip.hideSelectionTooltip;

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

export default function InlineCommentThread({
  pluginKey,
  permissions
}: {
  pluginKey: PluginKey<InlineCommentPluginState>;
  permissions?: IPagePermissionFlags;
}) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, show: isVisible, ids } = usePluginState(pluginKey) as InlineCommentPluginState;
  const { threads } = useThreads();

  const { currentPageActionDisplay } = usePageActionDisplay();
  // Find unresolved threads in the thread ids and sort them based on desc order of createdAt
  const unResolvedThreads = ids
    .map((threadId) => threads[threadId])
    .filter((thread) => thread && !thread?.resolved)
    .filter(isTruthy)
    .sort((threadA, threadB) =>
      threadA && threadB ? new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime() : 0
    );

  if ((currentPageActionDisplay !== 'comments' || permissions) && isVisible && unResolvedThreads.length !== 0) {
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

export function InlineCommentSubMenu({ pluginKey, pageId }: { pluginKey: PluginKey; pageId: string | undefined }) {
  const view = useEditorViewContext();
  const [commentContent, setCommentContent] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const { extractTextFromSelection } = useInlineComment();
  const { refetchThreads } = useThreads();
  const isEmpty = checkIsContentEmpty(commentContent);
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty && pageId) {
      e.preventDefault();
      const threadWithComment = await charmClient.comments.startThread({
        comment: commentContent,
        context: extractTextFromSelection(),
        pageId
      });
      // jsut refetch threads for now to make sure member is attached properly - optimize later by not needing to append members to output of useThreads
      refetchThreads();
      // setThreads((_threads) => ({ ..._threads, [threadWithComment.id]: threadWithComment }));
      updateInlineComment(threadWithComment.id)(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
      view.dispatch(tr);
      view.focus();
    }
  };

  return (
    <Box display='flex' width={{ xs: '100%', sm: '400px' }}>
      <Box flexGrow={1}>
        <InlineCharmEditor
          focusOnInit={true}
          content={commentContent}
          style={{
            fontSize: '14px'
          }}
          onContentChange={({ doc }) => {
            setCommentContent(doc);
          }}
        />
      </Box>
      <Button
        size='small'
        onClick={handleSubmit}
        sx={{
          alignSelf: 'flex-end',
          marginBottom: '4px',
          minWidth: ['36px', '64px'],
          px: ['4px', '10px']
        }}
        disabled={isEmpty}
      >
        {isSmallScreen ? <SendIcon /> : 'Start'}
      </Button>
    </Box>
  );
}
