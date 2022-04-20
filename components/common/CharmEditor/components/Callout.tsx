import { blockquote } from '@bangle.dev/base-components';
import { BaseRawNodeSpec, NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Menu } from '@mui/material';
import { Box } from '@mui/system';
import { BaseEmoji, Picker } from 'emoji-mart';
import { MouseEvent, ReactNode, useState } from 'react';

const StyledCallout = styled.div`
  background-color: ${({ theme }) => theme.palette.background.light};
  font-size: 20px;
  padding: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CalloutEmoji = styled.div`
  cursor: pointer;
  display: flex;
  align-items: flex-start;

  /* Duplicate. Make sure to reuse from StyledEmojiSquare */
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  & span {
    padding: ${({ theme }) => theme.spacing(0.5)};
    border-radius: ${({ theme }) => theme.spacing(0.5)};
    font-size: 16px;
  }

  & span:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.palette.emoji.hoverBackground};
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
`;

export function calloutSpec () {
  const spec = blockquote.spec() as BaseRawNodeSpec;
  spec.name = 'blockquote';
  spec.schema.attrs = {
    emoji: { default: '😃' }
  };
  return spec;
}

export function Callout ({ children, node, updateAttrs }: NodeViewProps & { children: ReactNode }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const theme = useTheme();

  return (
    <StyledCallout>
      <CalloutEmoji>
        <Box onClick={handleClick}>
          {node.attrs.emoji}
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <Picker
            theme={theme.palette.mode}
            onSelect={(emoji: BaseEmoji) => {
              updateAttrs({
                emoji: emoji.native
              });
              handleClose();
            }}
          />
        </Menu>
      </CalloutEmoji>
      {children}
    </StyledCallout>
  );
}
