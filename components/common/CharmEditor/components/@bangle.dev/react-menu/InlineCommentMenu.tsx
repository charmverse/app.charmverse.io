import { useEditorViewContext } from '@bangle.dev/react';
import SaveIcon from '@mui/icons-material/Save';
import { Box } from '@mui/material';
import { MenuInput } from 'components/common/MenuInput';
import React, { useRef, useState } from 'react';
import { updateInlineComment } from '../../InlineComment';
import { MenuButton } from './Icon';

export function InlineCommentSubMenu() {
  const view = useEditorViewContext();
  const [commentText, setCommentText] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = commentText.length === 0;
  const handleSubmit = (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDisabled) {
      e.preventDefault();
      // TODO: Update the attribute, set the id attribute to the created thread
      updateInlineComment('')(view.state, view.dispatch);
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