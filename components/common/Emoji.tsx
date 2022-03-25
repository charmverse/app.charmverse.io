import styled from '@emotion/styled';
import { ComponentProps, ReactNode, memo } from 'react';
import twemoji from 'twemoji';

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

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
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

function EmojiCon ({ icon, size = 'small', ...props }: ComponentProps<typeof Emoji> & { icon: string | ReactNode, size?: ImgSize }) {

  let iconContent: string | ReactNode = icon;

  // using deprectead feature, navigator.userAgent doesnt exist yet in FF - https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (typeof icon === 'string' && icon.startsWith('http')) {
    iconContent = <img src={icon} />;
  }
  else if (!isMac && typeof icon === 'string') {
    iconContent = (
      <span
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          // @ts-ignore
          __html: twemoji.parse(icon, {
            folder: 'svg',
            ext: '.svg'
          })
        }}
      />
    );
  }
  return (
    <Emoji size={size} {...props}>{iconContent}</Emoji>
  );
}

export default memo(EmojiCon);
