import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { getEmojiDataFromNative, Emoji as EmojiMart } from 'emoji-mart';
import { ComponentProps, ReactNode } from 'react';
import data from 'emoji-mart/data/all.json';

export const Emoji = styled(Box)`
  /* font family taken from Notion */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols;
  overflow: hidden;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  width: 78px;
  height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  border-radius: 4px;

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
`;

type ImgSize = 'large' | 'small';

const EmojiImg = styled.img<{ size: ImgSize }>`
  border-radius: ${({ size }) => size === 'large' ? '6px' : '3px'};
  height: ${({ size }) => size === 'large' ? '100%' : '18px'};
  width: auto;
  max-width: ${({ size }) => size === 'large' ? '100%' : '18px'};
`;

export default function EmojiCon ({ icon, size = 'small', ...props }: ComponentProps<typeof Emoji> & { icon: string | ReactNode, size?: ImgSize }) {
  if (typeof icon === 'string' && icon.startsWith('http')) {
    return <Emoji {...props}><EmojiImg size={size} src={icon} /></Emoji>;
  }
  if (typeof icon === 'string') {
    const emojiData = getEmojiDataFromNative(icon, 'apple', data);
    const fontSize = size === 'large' ? 78 : 18;
    return <Emoji {...props}><EmojiMart emoji={emojiData || ''} size={fontSize} /></Emoji>;
  }
  return (
    <Emoji {...props}>{icon}</Emoji>
  );
}
