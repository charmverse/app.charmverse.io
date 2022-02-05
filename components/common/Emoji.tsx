import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { ComponentProps } from 'react';

const Emoji = styled(Box)`
  /* font family taken from Notion */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  width: 100px;
  height: 100px;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light}
  }
`;

export default function EmojiCon ({ children, ...props }: ComponentProps<typeof Emoji>) {
  return (
    <Emoji {...props}>{children}</Emoji>
  );
}
