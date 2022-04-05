import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { memo } from 'react';

const StyledResizeHandle = styled(Box)`
  width: 7.5px;
  height: calc(100% - 25px);
  max-height: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  opacity: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 250ms ease-in-out;
  cursor: col-resize;

  &.react-resizable-handle-w {
    left: 15px;
  }

  &.react-resizable-handle-e {
    right: 15px;
  }

  &.react-resizable-handle-s {
    bottom: 15px;
  }
`;

export default memo(StyledResizeHandle);
