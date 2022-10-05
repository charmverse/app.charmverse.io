import { link } from '@bangle.dev/base-components';
import type { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveIcon from '@mui/icons-material/Save';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';

import { MenuInput } from 'components/common/MenuInput';

import { MenuButton } from './Icon';

export function LinkSubMenu ({ showMessage, getIsTop = () => true }: { showMessage: (msg: string) => void, getIsTop?: () => boolean }) {
  const view = useEditorViewContext();
  const result = link.queryLinkAttrs()(view.state);
  const originalHref = (result && result.href) || '';

  return (
    <LinkMenu
      showMessage={showMessage}
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

function LinkMenu ({
  getIsTop,
  view,
  originalHref = '',
  showMessage
}: {
  showMessage: (msg: string) => void;
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
  const isSavedDisabled = href === originalHref || (!/^(ipfs|http(s?)):\/\//i.test(href));

  return (
    <Box sx={{
      display: 'flex'
    }}
    >
      <MenuInput
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

          }
        }}
        onChange={(e) => {
          setHref(e.target.value);
          e.preventDefault();
        }}
      />
      <MenuButton disableButton={isSavedDisabled} hints={['Save']}>
        <SaveIcon
          color={!isSavedDisabled ? 'inherit' : 'disabled'}
          sx={{
            fontSize: 14
          }}
          onClick={() => {
            // Only update attribute if the value has changed
            if (!isSavedDisabled) {
              link.updateLink(href)(view.state, view.dispatch);
            }
          }}
        />
      </MenuButton>
      <MenuButton
        hints={['Go to link']}
        onMouseDown={(e) => {
          e.preventDefault();
          window.open(href, '_blank');
        }}
      >
        <OpenInNewIcon sx={{
          fontSize: 14
        }}
        />
      </MenuButton>
      <MenuButton hints={['Copy link']}>
        <ContentCopyIcon
          sx={{
            fontSize: 12
          }}
          onClick={() => {
            navigator.clipboard.writeText(href);
            showMessage('Link copied to clipboard');
          }}
        />
      </MenuButton>
      <MenuButton hints={['Remove link']}>
        <DeleteIcon
          sx={{
            fontSize: 14
          }}
          onClick={() => {
            link.updateLink()(view.state, view.dispatch);
          }}
        />
      </MenuButton>
    </Box>
  );
}
