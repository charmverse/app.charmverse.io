import styled from '@emotion/styled';
import { Box, Menu } from '@mui/material';
import { getTwitterEmoji } from '@packages/lib/utils/emoji';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';

import { CustomEmojiPicker } from 'components/common/CustomEmojiPicker';

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

const StyledDiv = styled.div<{ readOnly: boolean }>`
  width: 35px;
  height: 35px;
  font-size: 20px;
  padding: 0.75px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${({ theme }) => theme.transitions.duration.shorter}ms;

  &:hover {
    transition: background-color ${({ theme }) => theme.transitions.duration.shorter}ms;
    background-color: ${({ theme, readOnly }) => (readOnly ? 'transparent' : theme.palette.emoji.hoverBackground)};
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
          <StyledDiv readOnly={readOnly} onMouseDown={readOnly ? undefined : handleClick}>
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
          </StyledDiv>
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
