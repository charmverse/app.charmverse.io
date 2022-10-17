import styled from '@emotion/styled';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';
import twemoji from 'twemoji';

import { isMac } from 'lib/utilities/browser';

type ImgSize = 'large' | 'small';

export const Emoji = styled.div<{ size?: ImgSize }>`
  /* font family taken from Notion */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols;
  font-size: ${({ size }) => size === 'large' ? '78px' : 'inherit'};
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
  ${({ onClick, theme }) => {
    if (onClick) {
      return `
        &:hover {
          background-color: ${theme.palette.background.light};
        }
      `;
    }
  }}
  span {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  img {
    border-radius: ${({ size }) => size === 'large' ? '6px' : '3px'};
    height: ${({ size }) => size === 'large' ? '100%' : '18px'};
    width: auto;
    max-width: ${({ size }) => size === 'large' ? '100%' : '18px'};
  }
`;

// Use system font for Mac OS, but Twitter emojis for everyone else
export function getTwitterEmoji (emoji: string): string | null {
  if (isMac()) return null;

  // @ts-ignore - library type is incorrect
  const html = twemoji.parse(emoji, {
    folder: 'svg',
    ext: '.svg'
  }) as string;
  const match = /<img.*?src="(.*?)"/.exec(html);
  return match ? match[1] : null;
}

function EmojiIcon ({ icon, size = 'small', ...props }: ComponentProps<typeof Emoji> & { icon: string | ReactNode, size?: ImgSize }) {
  let iconContent: string | ReactNode = icon;
  if (typeof icon === 'string' && icon.startsWith('http')) {
    iconContent = <img src={icon} />;
  }
  else if (typeof icon === 'string') {
    const twemojiImage = getTwitterEmoji(icon);
    if (twemojiImage) {
      iconContent = <img src={twemojiImage} />;
    }
  }
  return (
    <Emoji size={size} {...props}>{iconContent}</Emoji>
  );
}

export default memo(EmojiIcon);
