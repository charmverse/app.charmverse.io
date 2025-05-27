import styled from '@emotion/styled';
import { getTwitterEmoji } from '@packages/utils/emoji';
import type { ComponentProps, ReactNode } from 'react';
import { memo } from 'react';

type ImgSize = 'large' | 'small';
export const Emoji = styled.div<{ size?: ImgSize }>`
  font-size: ${({ size }) => (size === 'large' ? '78px' : 'inherit')};
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
        // disable hover UX on ios which converts first click to a hover event
        @media (pointer: fine) {
          &:hover {
            background-color: ${theme.palette.background.light};
          }
        }
      `;
    }
  }}
  img {
    border-radius: ${({ size }) => (size === 'large' ? '6px' : '3px')};
    height: ${({ size }) => (size === 'large' ? '100%' : '18px')};
    width: auto;
    max-width: ${({ size }) => (size === 'large' ? '100%' : '18px')};
  }
`;

function EmojiIcon({
  icon,
  size = 'small',
  ...props
}: ComponentProps<typeof Emoji> & { icon: string | ReactNode; size?: ImgSize }) {
  let iconContent: string | ReactNode = icon;
  if (typeof icon === 'string' && icon.startsWith('http')) {
    iconContent = (
      <img
        src={icon}
        style={{
          objectFit: 'cover'
        }}
      />
    );
  } else if (typeof icon === 'string') {
    const twemojiImage = getTwitterEmoji(icon);
    if (twemojiImage) {
      iconContent = <img src={twemojiImage} />;
    }
  }
  return (
    <Emoji size={size} {...props}>
      {iconContent}
    </Emoji>
  );
}

export default memo(EmojiIcon);
