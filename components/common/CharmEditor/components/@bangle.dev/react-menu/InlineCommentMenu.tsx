import { useEditorViewContext } from '@bangle.dev/react';
import SaveIcon from '@mui/icons-material/Save';
import { Box } from '@mui/material';
import charmClient from 'charmClient';
import { MenuInput } from 'components/common/MenuInput';
import { usePages } from 'hooks/usePages';
import React, { useRef, useState } from 'react';
import { mutate } from 'swr';
import { updateInlineComment } from '../../InlineComment';
import { MenuButton } from './Icon';

export function InlineCommentSubMenu() {
  const view = useEditorViewContext();
  const [commentText, setCommentText] = useState('');
  const {currentPageId} = usePages()
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = commentText.length === 0;
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<SVGSVGElement, MouseEvent>) => {
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
      <MenuButton disableButton={isDisabled} hints={["Save"]}>
        <SaveIcon color={!isDisabled ? "inherit" : "disabled"} sx={{
          fontSize: 14
        }} onClick={(e) => {
          handleSubmit(e)
        }}/>
      </MenuButton>
    </Box>
  );
}