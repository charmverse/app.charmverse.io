import { styled } from '@mui/material';
import { memo } from 'react';
import { ResizableBox } from 'react-resizable';

const StyledResizeHandle = styled(ResizableBox)`
  .react-resizable-handle {
    background-color: ${({ theme }) => theme.palette.background.dark};
    opacity: 0;
    position: absolute;
    transition: opacity 250ms ease-in-out;
    background-image: none;
  }

  .react-resizable-handle-w,
  .react-resizable-handle-e {
    cursor: ew-resize;
    border-radius: ${({ theme }) => theme.spacing(2)};
    height: calc(100% - 25px);
    max-height: 75px;
    width: 6px;
    top: 50%;
    transform: translateY(-50%);
  }

  .react-resizable-handle-n,
  .react-resizable-handle-s {
    border-radius: ${({ theme }) => theme.spacing(2)};
    cursor: ns-resize;
    height: 6px;
    width: 75px;
    transform: none;
    margin-left: -33px;
  }

  .react-resizable-handle-sw,
  .react-resizable-handle-se {
    background-image: none;
    border-style: solid;
    border-color: ${({ theme }) => theme.palette.background.dark};
    border-width: 0 3px 3px 0;
    bottom: 10px;
    display: inline-block;
    padding: 3px;
    background-color: transparent;
  }

  .react-resizable-handle-w,
  .react-resizable-handle-sw {
    left: 10px;
  }

  .react-resizable-handle-e,
  .react-resizable-handle-se {
    right: 10px;
  }

  .react-resizable-handle-s {
    bottom: 10px;
  }
`;

export default memo(StyledResizeHandle);
