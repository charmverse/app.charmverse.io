import { useEditorViewContext } from '@bangle.dev/react';
import SaveIcon from '@mui/icons-material/Save';
import { Box } from '@mui/material';
import { MenuInput } from 'components/common/MenuInput';
import React, { useRef, useState } from 'react';
import { MenuButton } from './Icon';

export function InlineCommentSubMenu() {
  const view = useEditorViewContext();
  const [commentText, setCommentText] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log({commentText})
    // link.updateLink(href)(view.state, view.dispatch);
    view.focus();
  };

  const isDisabled = commentText.length === 0;

  return (
    <Box sx={{
      display: "flex"
    }}>
      <MenuInput
        value={commentText}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            view.focus();
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
        }} onClick={() => {
          if (!isDisabled) {
            // TODO: Update the attribute, set the id attribute to the created thread
            // link.updateLink(href)(view.state, view.dispatch);
          }
        }}/>
      </MenuButton>
    </Box>
  );
}