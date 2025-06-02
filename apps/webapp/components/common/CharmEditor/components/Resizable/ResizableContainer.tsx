import { styled } from '@mui/material';
import { memo } from 'react';

const ResizerContainer = styled('div')`
  max-width: 100%;
  &:hover .react-resizable-handle {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
  & .react-resizable {
    display: inline-block;
    max-width: 100%;
  }
`;

export default memo(ResizerContainer);
