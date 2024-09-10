import styled from '@emotion/styled';
import { Box, IconButton, Menu } from '@mui/material';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';

import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';
import { getTwitterEmoji } from 'lib/utils/emoji';

import type { CharmNodeViewProps } from '../../nodeView/nodeView';

const StyledCallout = styled.div`
  background-color: ${({ theme }) => theme.palette.background.light};
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};

  h1,
  h2,
  h3,
  h4,
  h5 {
    margin: 0 !important; // override global editor styles
  }
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

export default function Callout({
  children,
  node,
  updateAttrs,
  readOnly
}: CharmNodeViewProps & { children: ReactNode }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const emoji = node.attrs.emoji;
  const twemojiImage = emoji?.startsWith('http') ? emoji : getTwitterEmoji(emoji);

  return (
    <Box py={0.5}>
      <StyledCallout>
        <CalloutEmoji>
          <IconButton
            sx={{
              width: 35,
              height: 35,
              fontSize: 20,
              padding: 0.75,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // This is necessary to fix a bug on Macbook, where readonly emojis showed as greyed out
              '&.Mui-disabled': {
                color: '#FFFFFFFF'
              }
            }}
            // use onMouseDown - for some reason, onClick gets intercepted by the editor
            onMouseDown={handleClick}
            disabled={readOnly}
          >
            {twemojiImage ? (
              <img
                style={{
                  cursor: 'pointer',
                  transition: 'background 100ms ease-in-out',
                  objectFit: 'cover',
                  width: 22,
                  height: 22
                }}
                src={twemojiImage}
              />
            ) : (
              <div
                style={{
                  cursor: 'pointer',
                  transition: 'background 100ms ease-in-out'
                }}
              >
                {node.attrs.emoji}
              </div>
            )}
          </IconButton>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <CustomEmojiPicker
              onUpdate={(_emoji) => {
                updateAttrs({
                  emoji: _emoji
                });
                handleClose();
              }}
            />
          </Menu>
        </CalloutEmoji>
        {/** Wrap children in a container  to prevent iframe embeds escaping the parent * */}
        <Box flexGrow={1} sx={{ overflowX: 'hidden' }}>
          {children}
        </Box>
      </StyledCallout>
    </Box>
  );
}
