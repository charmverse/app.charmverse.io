import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { Box, Button } from '@mui/material';
import charmClient from 'charmClient';
import { MenuInput } from 'components/common/MenuInput';
import { usePages } from 'hooks/usePages';
import { TextSelection } from 'prosemirror-state';
import React, { useRef, useState } from 'react';
import { mutate } from 'swr';
import { floatingMenuPluginKey } from '../../FloatingMenu';
import { updateInlineComment } from '../../InlineComment';

export function InlineCommentSubMenu() {
  const view = useEditorViewContext();
  const [commentText, setCommentText] = useState('');
  const {currentPageId} = usePages()
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = commentText.length === 0;
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isDisabled) {
      e.preventDefault();
      const {thread} = await charmClient.startThread({
        content: commentText,
        // Get the context from current selection
        context: view.state.doc.cut(view.state.selection.from, view.state.selection.to).textContent,
        pageId: currentPageId
      });
      mutate(`pages/${currentPageId}/threads`)
      updateInlineComment(thread.id)(view.state, view.dispatch);
      hideSelectionTooltip(floatingMenuPluginKey)(view.state, view.dispatch, view)
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)))
      view.dispatch(tr)
      view.focus();
    }
  };

  return (
    <Box sx={{
      display: "flex"
    }}>
      <MenuInput
        value={commentText}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmit(e);
            return;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            view.focus();
            return;
          }
        }}
        onChange={(e) => {
          setCommentText(e.target.value);
          e.preventDefault();
        }}
      />
      <Button size="small" onClick={(e) => {
        handleSubmit(e)
      }} sx={{
        fontSize: 14
      }} disabled={isDisabled}>
        Start
      </Button>
    </Box>
  );
}