import { link } from '@bangle.dev/base-components';
import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';
import { MenuButton } from './Icon';

export function LinkSubMenu({ getIsTop = () => true }) {
  const view = useEditorViewContext();
  const result = link.queryLinkAttrs()(view.state);
  const originalHref = (result && result.href) || '';

  return (
    <LinkMenu
      // (hackish) Using the key to unmount then mount
      // the linkmenu so that it discards any preexisting state
      // in its `href` and starts fresh
      key={originalHref}
      originalHref={originalHref}
      view={view}
      getIsTop={getIsTop}
    />
  );
}

const StyledInput = styled.input`
  background: ${({theme}) => theme.palette.background.default};
  outline: none;
  border: none;
  border-radius: ${({theme}) => theme.spacing(0.5)};
  padding: ${({theme}) => theme.spacing(1)};
  color: inherit;
  font-size: 16px;
`

function LinkMenu({
  getIsTop,
  view,
  originalHref = '',
}: {
  getIsTop: () => boolean;
  view: EditorView;
  originalHref?: string;
}) {
  const [href, setHref] = useState(originalHref);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => {
    link.updateLink(href)(view.state, view.dispatch);
    view.focus();
  };

  return (
    <Box sx={{
      display: "flex"
    }}>
      <StyledInput
        value={href}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            view.focus();
            return;
          }
          const isTop = getIsTop();
          if (isTop && e.key === 'ArrowDown') {
            e.preventDefault();
            view.focus();
            return;
          }
          if (!isTop && e.key === 'ArrowUp') {
            e.preventDefault();
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
          setHref(e.target.value);
          e.preventDefault();
        }}
      />
      <MenuButton disableButton={href === originalHref} hints={["Save"]}>
        <SaveIcon color={href !== originalHref ? "inherit" : "disabled"} sx={{
          fontSize: 14
        }} onClick={() => {
          // Only update attribute if the value has changed
          if (href !== originalHref) {
            link.updateLink(href)(view.state, view.dispatch);
          }
        }}/>
      </MenuButton>
      <MenuButton
        hints={["Visit"]}
        onMouseDown={(e) => {
          e.preventDefault();
          window.open(href, '_blank');
        }}
      >
        <LinkIcon sx={{
          fontSize: 14
        }}/>
      </MenuButton>
      <MenuButton hints={["Remove link"]}>
        <DeleteIcon sx={{
          fontSize: 14
        }} onClick={() => {
          link.updateLink()(view.state, view.dispatch);
        }}/>
      </MenuButton>
    </Box>
  );
}
