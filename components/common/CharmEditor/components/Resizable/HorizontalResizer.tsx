import { ReactNode, memo } from 'react';
import { ResizableBox, ResizableProps } from 'react-resizable';
import ResizableHandle from './ResizableHandle';
import ResizableContainer from './ResizableContainer';

interface ResizerProps {
  children: ReactNode
  width: number
  minWidth: number
  maxWidth?: number
  onResize?: ResizableProps['onResize']
  onResizeStop?: ResizableProps['onResizeStop']
}

function Resizer (props: ResizerProps) {

  return (
    <ResizableContainer>
      <ResizableBox
        onResize={props.onResize}
        width={props.width}
        // @ts-ignore give a garbage value to height
        height=''
        resizeHandles={['w', 'e']}
        onResizeStop={props.onResizeStop}
        minConstraints={[props.minWidth, Infinity]}
        maxConstraints={props.maxWidth ? [props.maxWidth, Infinity] : undefined}
        /* eslint-disable-next-line */
        handle={(handleAxis: string, ref: React.Ref<unknown>) => <ResizableHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
      >
        {props.children}
      </ResizableBox>
    </ResizableContainer>
  );
}

export default memo(Resizer);
