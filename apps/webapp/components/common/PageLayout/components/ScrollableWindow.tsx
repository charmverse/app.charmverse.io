import styled from '@emotion/styled';
import { Box } from '@mui/material';

const ScrollableWindow = styled(Box)<{ hideScroll?: boolean }>`
  flex-grow: 1;
  overflow: auto;
`;

export default ScrollableWindow;
