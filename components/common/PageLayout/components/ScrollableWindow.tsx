import styled from '@emotion/styled';

const ScrollableWindow = styled.div<{hideScroll?: boolean}>`
  flex-grow: 1;
  overflow: ${({ hideScroll }) => hideScroll ? 'hidden' : 'auto'};
`;

export default ScrollableWindow;
