import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { memo } from 'react';

const StyledResizeHandle = styled(Box)`
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  opacity: 0;
  position: absolute;
  transition: opacity 250ms ease-in-out;
  background-image: none;

  &.react-resizable-handle-w,
  &.react-resizable-handle-e {
    cursor: ew-resize;
    height: calc(100% - 25px);
    max-height: 75px;
    width: 6px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.react-resizable-handle-n,
  &.react-resizable-handle-s {
    cursor: ns-resize;
    height: 6px;
    width: 75px;
    transform: none;
    margin-left: -33px;
  }

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
