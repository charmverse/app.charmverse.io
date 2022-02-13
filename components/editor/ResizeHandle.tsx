import styled from '@emotion/styled';
import { Box } from '@mui/system';

export const StyledResizeHandle = styled(Box)<{pos: 'right' | 'left'}>`
  width: 7.5px;
  height: calc(100% - 15px);
  max-height: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 250ms ease-in-out;
  ${({ pos }) => pos === 'left' ? 'left: 15px' : 'right: 15px'};
  cursor: col-resize;
`;
