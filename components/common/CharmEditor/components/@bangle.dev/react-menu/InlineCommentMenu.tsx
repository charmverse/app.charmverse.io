import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { useTheme } from '@emotion/react';
import { Box, Button } from '@mui/material';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { useContributors } from 'hooks/useContributors';
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
  const [contributors] = useContributors()
  const {setThreads} = useThreads()
  const {currentPageId, pages} = usePages()
  const isEmpty = checkForEmpty(commentContent);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      e.preventDefault();
      // Get the context from current selection
      const cutDoc = view.state.doc.cut(view.state.selection.from, view.state.selection.to);
      let context = '';
      cutDoc.descendants(node => {
        if (node.isText) {
          context += node.text 
        } else if (node.type.name === "mention") {
          const {type, value} = node.attrs;
          if (type === "user") {
            const contributor = contributors.find(_contributor => _contributor.id === value);
            if (contributor) {
              context += `@${(contributor.username ?? contributor.addresses[0])}`
            }
          } else {
            const page = pages[value];
            if (page) {
              context += `@${page.title}`
            }
          }
        } else if (node.type.name === "emoji") {
          context += node.attrs.emoji
        }
      })
      const threadWithComment = await charmClient.startThread({
        content: commentContent,
        context,
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