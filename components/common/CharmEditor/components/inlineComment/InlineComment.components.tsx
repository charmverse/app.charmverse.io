import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Box, Button, ClickAwayListener } from '@mui/material';
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

const ThreadContainerBox = styled(Box)`
  max-height: 400px;
  overflow: auto;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
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

  const { showingCommentThreadsList } = useCommentThreadsListDisplay();
  const unResolvedThreads = threadIds
    .map(threadId => threads[threadId])
    .filter(thread => !thread?.resolved)
    .sort((threadA, threadB) => threadA && threadB ? (new Date(threadB.createdAt).getTime() - new Date(threadA.createdAt).getTime()) : 0);

  if (isVisible && component === 'inlineComment' && unResolvedThreads.length !== 0) {
    // Only show comment thread on inline comment if the page threads list is not active
    return !showingCommentThreadsList ? createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
      }}
      >
        <ThreadContainerBox>
          {unResolvedThreads.map(resolvedThread => resolvedThread
            && <PageThread key={resolvedThread.id} threadId={resolvedThread?.id} />)}
        </ThreadContainerBox>
      </ClickAwayListener>,
      tooltipContentDOM
    ) : null;
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
    <Box sx={{
      display: 'flex',
      width: 300
    }}
    >
      <Box sx={{
        width: 'calc(100% - 75px)'
      }}
      >
        <InlineCharmEditor
          content={commentContent}
          style={{
            padding: theme.spacing(0, 1)
          }}
          onContentChange={({ doc }) => {
            setCommentContent(doc);
          }}
        />
      </Box>
      <Button
        size='small'
        onClick={(e) => {
          handleSubmit(e);
        }}
        sx={{
          alignSelf: 'flex-end',
          fontSize: 14
        }}
        disabled={isEmpty}
      >
        Start
      </Button>
    </Box>
  );
}
