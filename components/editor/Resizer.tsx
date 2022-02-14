import { Box } from '@mui/material';
import useResize from 'hooks/useResize';
import { ReactNode } from 'react';
import { ResizeHandle } from './ResizeHandle';

interface ResizerProps {
  maxWidth: number
  minWidth: number
  children: ReactNode
}

export default function Resizer (props: ResizerProps) {
  const resizeState = useResize({ initialWidth: 500 });
  const { maxWidth, minWidth, children } = props;

  return (
    <Box
      sx={{
        position: 'relative',
        cursor: 'col-resize',
        width: resizeState.width,
        '&:hover .resize-handler': {
          opacity: resizeState.isDragging ? 0 : 1,
          transition: 'opacity 250ms ease-in-out'
        }
      }}
    >
      <ResizeHandle maxWidth={maxWidth} minWidth={minWidth} {...resizeState} position='left' />
      {children}
      <ResizeHandle maxWidth={maxWidth} minWidth={minWidth} {...resizeState} position='right' />
    </Box>
  );
}
