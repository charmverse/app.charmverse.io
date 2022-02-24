import { EditorViewContext } from '@bangle.dev/react';
import { getSuggestTooltipKey } from '@bangle.dev/react-emoji-suggest/dist/emoji-suggest';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { emojiSuggestKey } from 'components/editor/EmojiSuggest';
import { ComponentProps, ReactNode, useContext, useRef } from 'react';

const Emoji = styled(Box)`
  /* font family taken from Notion */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  width: 80px;
  height: 80px;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  &:before {
    border-radius: 4px;
    content: " ";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    z-index: -1;
    background-color: ${({ theme }) => theme.palette.background.light}
  }
  &:hover:before {
    opacity: 0.5;
  }
`;

export default function EmojiCon ({ children, ...props }: ComponentProps<typeof Emoji>) {
  return (
    <Emoji {...props}>{children}</Emoji>
  );
}

export function EmojiContainer (
  { updatePageIcon, children }: { updatePageIcon: (icon: string) => void, children: ReactNode }
) {
  const view = useContext(EditorViewContext);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box
      sx={{
        width: 'fit-content',
        display: 'flex'
      }}
      ref={ref}
      onClick={() => {
        if (view.dispatch!) {
          const suggestTooltipKey = getSuggestTooltipKey(emojiSuggestKey)(view.state);
          const suggestTooltipState = suggestTooltipKey.getState(view.state);

          // If the emoji suggest already has a ref attached its already visible, we need to hide it

          if (suggestTooltipState.show) {
            view.dispatch(
              view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
            );
          }
          else {
            view.dispatch(
              // Chain transactions together
              view.state.tr.setMeta(emojiSuggestKey, {
                type: 'INSIDE_PAGE_ICON',
                onClick: (emoji: string) => updatePageIcon(emoji),
                ref: ref.current,
                getPos: () => 0
              }).setMeta(suggestTooltipKey, { type: 'RENDER_TOOLTIP' }).setMeta('addToHistory', false)
            );
          }
        }
      }}
    >
      {children}
    </Box>
  );
}
