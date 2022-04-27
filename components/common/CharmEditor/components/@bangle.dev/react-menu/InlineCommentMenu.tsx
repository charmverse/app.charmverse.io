import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { useTheme } from '@emotion/react';
import { Box, Button } from '@mui/material';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { usePages } from 'hooks/usePages';
import { useThreads } from 'hooks/useThreads';
import { PageContent } from 'models';
import { PluginKey, TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { mutate } from 'swr';
import { updateInlineComment } from '../../inlineComment';

export function InlineCommentSubMenu({pluginKey}: {pluginKey: PluginKey}) {
  const theme = useTheme()
  const view = useEditorViewContext();
  const [commentContent, setCommentContent] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const {setThreads} = useThreads()
  const {currentPageId} = usePages()
  const isEmpty = checkForEmpty(commentContent);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      e.preventDefault();
      const threadWithComment = await charmClient.startThread({
        content: commentContent,
        // Get the context from current selection
        context: view.state.doc.cut(view.state.selection.from, view.state.selection.to).textContent,
        pageId: currentPageId
      });
      setThreads((_threads) =>({..._threads, [threadWithComment.id]: threadWithComment}))
      updateInlineComment(threadWithComment.id)(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view)
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)))
      view.dispatch(tr)
      view.focus();
    }
  };

  return (
    <Box sx={{
      display: "flex",
      width: 300
    }}>
      <Box sx={{
        width: 'calc(100% - 75px)'
      }}>
        <InlineCharmEditor content={commentContent} style={{
          padding: theme.spacing(0, 1)
        }} onContentChange={({doc}) => {
          setCommentContent(doc);
        }}/>
      </Box>
      <Button size="small" onClick={(e) => {
        handleSubmit(e)
      }} sx={{
        alignSelf: "flex-end",
        fontSize: 14
      }} disabled={isEmpty}>
        Start
      </Button>
    </Box>
  );
}