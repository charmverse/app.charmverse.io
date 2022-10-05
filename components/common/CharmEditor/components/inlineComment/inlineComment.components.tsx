import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import styled from '@emotion/styled';
import { Box, Button, ClickAwayListener, Grow, Paper } from '@mui/material';
import type { PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { useInlineComment } from 'hooks/useInlineComment';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { isTruthy } from 'lib/utilities/types';
import type { PageContent } from 'models';

import { hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import PageThread from '../PageThread';

import type { InlineCommentPluginState } from './inlineComment.plugins';
import { updateInlineComment } from './inlineComment.utils';

export const ThreadContainer = styled(Paper)`
  max-height: 400px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: column;
  min-width: 500px;
  overflow: auto;
`;

export default function InlineCommentThread ({ pluginKey }: { pluginKey: PluginKey<InlineCommentPluginState> }) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    ids
  } = usePluginState(pluginKey) as InlineCommentPluginState;
  const { threads } = useThreads();
  const cardId = (new URLSearchParams(window.location.href)).get('cardId');

  const { currentPageActionDisplay } = usePageActionDisplay();
  // Find unresolved threads in the thread ids and sort them based on desc order of createdAt
  const unResolvedThreads = ids
    .map(threadId => threads[threadId])
    .filter(thread => thread && !thread?.resolved)
    .filter(isTruthy)
    .sort((threadA, threadB) => threadA && threadB ? (new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime()) : 0);

  if ((currentPageActionDisplay !== 'comments' || cardId) && isVisible && unResolvedThreads.length !== 0) {
    // Only show comment thread on inline comment if the page threads list is not active
    return createPortal(
      <ClickAwayListener onClickAway={() => {
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

            {unResolvedThreads.map(resolvedThread => (
              <ThreadContainer elevation={4}>
                <PageThread inline={ids.length === 1} key={resolvedThread.id} threadId={resolvedThread?.id} />
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

export function InlineCommentSubMenu ({ pluginKey }: { pluginKey: PluginKey }) {
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
  const { setThreads } = useThreads();
  const { currentPageId } = usePages();
  const isEmpty = checkIsContentEmpty(commentContent);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {

    if (!isEmpty) {
      const cardId = typeof window !== 'undefined' ? (new URLSearchParams(window.location.href)).get('cardId') : null;
      e.preventDefault();
      const threadWithComment = await charmClient.startThread({
        comment: commentContent,
        context: extractTextFromSelection(),
        pageId: cardId ?? currentPageId
      });
      setThreads((_threads) => ({ ..._threads, [threadWithComment.id]: threadWithComment }));
      updateInlineComment(threadWithComment.id)(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view);
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
      view.dispatch(tr);
      view.focus();
    }
  };

  return (
    <Box display='flex' width='400px'>
      <Box flexGrow={1}>
        <InlineCharmEditor
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
          marginRight: '8px'
        }}
        disabled={isEmpty}
      >
        Start
      </Button>
    </Box>
  );
}
