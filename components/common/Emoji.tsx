import Box from '@mui/material/Box';
import styled from '@emotion/styled';

const Emoji = styled(Box)`
  /* font family taken from Notion */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols;
  line-height: 1em;
  white-space: nowrap;
`;

export default function EmojiCon ({ children, ...props }: React.ComponentProps<typeof Emoji>) {
  return (
    <Emoji role='image' {...props}>{children}</Emoji>
  )
}