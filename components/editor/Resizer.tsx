import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { ResizableBox, ResizableProps } from 'react-resizable';

interface ResizerProps {
  maxSize?: number
  minSize?: number
  children: ReactNode
  onResize?: ResizableProps['onResize']
  minConstraints?: ResizableProps['minConstraints']
  maxConstraints?: ResizableProps['maxConstraints']
}

export const StyledResizeHandle = styled(Box)`
  width: 7.5px;
  height: calc(100% - 15px);
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
`;

export default function Resizer (props: ResizerProps) {
  const { onResize, minConstraints, maxConstraints, minSize = 250, maxSize = 750, children } = props;

  return (
    <Box
      sx={{
        '&:hover .react-resizable-handle': {
          opacity: 1,
          transition: 'opacity 250ms ease-in-out'
        },
        '& .react-resizable': {
          display: 'flex'
        }
      }}
    >
      <ResizableBox
        onResize={onResize}
        width={maxConstraints?.[0] ?? maxSize}
        height={maxConstraints?.[1] ?? maxSize}
        resizeHandles={['w', 'e']}
        lockAspectRatio
        minConstraints={minConstraints ?? [minSize, minSize]}
        maxConstraints={maxConstraints ?? [maxSize, maxSize]}
        /* eslint-disable-next-line */
        handle={(handleAxis: string, ref: React.Ref<unknown>) => <StyledResizeHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
      >
        {children}
      </ResizableBox>
    </Box>
  );
}
