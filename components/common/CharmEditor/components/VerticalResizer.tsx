import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { ResizableBox, ResizableProps } from 'react-resizable';

interface ResizerProps {
  width: number
  height: number
  children: ReactNode
  onResize?: ResizableProps['onResize']
  minConstraints?: ResizableProps['minConstraints']
  maxConstraints?: ResizableProps['maxConstraints']
  onResizeStop?: ResizableProps['onResizeStop']
}

export const StyledResizeHandle = styled(Box)`
  height: 7.5px;
  width: 75px;
  border-radius: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.dark};
  opacity: 0;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 250ms ease-in-out;
  cursor: row-resize;

  &.react-resizable-handle-s {
    bottom: 15px;
  }
`;

export default function VerticalResizer (props: ResizerProps) {
  const { width, height, onResizeStop, onResize, minConstraints,
    maxConstraints, children } = props;

  return (
    <Box
      sx={{
        '&:hover .react-resizable-handle': {
          opacity: 1,
          transition: 'opacity 250ms ease-in-out'
        },
        '& .react-resizable': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }
      }}
    >
      <ResizableBox
        onResize={onResize}
        width={width}
        height={height}
        resizeHandles={['s']}
        lockAspectRatio
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        onResizeStop={onResizeStop}
        /* eslint-disable-next-line */
        handle={(handleAxis: string, ref: React.Ref<unknown>) => <StyledResizeHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
      >
        {children}
      </ResizableBox>
    </Box>
  );
}
