
import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, IconButton, Menu } from '@mui/material';
import { getTwitterEmoji } from 'components/common/Emoji';
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

export default function Callout ({ children, node, updateAttrs }: NodeViewProps & { children: ReactNode }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const theme = useTheme();
  const twemojiImage = getTwitterEmoji(node.attrs.emoji);

  return (
    <StyledCallout>
      <CalloutEmoji>
        <IconButton
          sx={{
            width: 35,
            height: 35,
            fontSize: 20
          }}
          onClick={handleClick}
        >
          {twemojiImage ? <img src={twemojiImage} /> : node.attrs.emoji}
        </IconButton>
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
