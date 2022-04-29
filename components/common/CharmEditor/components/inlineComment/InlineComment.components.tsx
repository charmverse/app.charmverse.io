import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, Button, ClickAwayListener, Grow, Paper } from '@mui/material';
import { useThreads } from 'hooks/useThreads';
import { createPortal } from 'react-dom';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { useTheme } from '@emotion/react';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { useInlineComment } from 'hooks/useInlineComment';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { PluginKey, TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { useCommentThreadsListDisplay } from 'hooks/useCommentThreadsListDisplay';
import PageThread from '../PageThread';
import { SuggestTooltipPluginKey, SuggestTooltipPluginState, hideSuggestionsTooltip } from '../@bangle.dev/tooltip/suggest-tooltip';
import { updateInlineComment } from './inlineComment.utils';

const ThreadContainer = styled(Paper)`
  max-height: 400px;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: column;
  min-width: 500px;
  overflow: auto;
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

  const { showingCommentThreadsList } = useCommentThreadsListDisplay();
  // Find unresolved threads in the thread ids and sort them based on desc order of createdAt
  const unResolvedThreads = threadIds
    .map(threadId => threads[threadId])
    .filter(thread => !thread?.resolved)
    .sort((threadA, threadB) => threadA && threadB ? (new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime()) : 0);

  if (!showingCommentThreadsList && isVisible && component === 'inlineComment' && unResolvedThreads.length !== 0) {
    // Only show comment thread on inline comment if the page threads list is not active
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
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
          <ThreadContainer elevation={4}>
            {unResolvedThreads.map(resolvedThread => resolvedThread
              && <PageThread key={resolvedThread.id} threadId={resolvedThread?.id} />)}
          </ThreadContainer>
        </Grow>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

export function InlineCommentSubMenu ({ pluginKey }: {pluginKey: PluginKey}) {
  const theme = useTheme();
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
  const isEmpty = checkForEmpty(commentContent);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      e.preventDefault();
      const threadWithComment = await charmClient.startThread({
        content: commentContent,
        context: extractTextFromSelection(),
        pageId: currentPageId
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
