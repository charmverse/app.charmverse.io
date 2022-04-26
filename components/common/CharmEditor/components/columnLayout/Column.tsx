import { Node } from '@bangle.dev/pm';
import styled from '@emotion/styled';
import { ReactNode, memo, useCallback, useState } from 'react';
import HorizontalResizer from '../Resizable/HorizontalResizer';

const StyledColumnBlock = styled.div`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  position: relative;
  transition: background-color 250ms ease-in-out;

  &:hover {
    transition: background-color 250ms ease-in-out;
    background-color: ${({ theme }) => theme.palette.background.light};
  }

  & .bangle-nv-content p {
    overflow-wrap: anywhere;
  }

  margin: 0 -4px;

  > div {
    padding: 0 4px;
  }
`;

interface Props { attrs?: { width?: number }, node: Node, children: ReactNode, updateAttrs: (attrs: any) => void }

function ColumnBlock ({ children, node, attrs = {}, updateAttrs }: Props) {

  const [size, setSize] = useState(attrs.width || 100);
  const onResizeStopCallback = useCallback((_, data) => {
    console.log('resized', data.size);
    updateAttrs({
      width: data.size.width
    });
    // if (onResizeStop) {
    //   onResizeStop(view);
    // }
  }, []);

  const onResizeCallback = useCallback((_, data) => {
    if (typeof data.size.width === 'number') {
      setSize(data.size.width);
      console.log('width', data.size.width);
      updateAttrs({
        width: data.size.width
      });
    }
  }, []);

  return (
    <StyledColumnBlock>
      <div>
        <HorizontalResizer
          onResizeStop={onResizeStopCallback}
          width={size}
          minWidth={60}
          maxWidth={400}
          onResize={onResizeCallback}
        >
          {children}
        </HorizontalResizer>
      </div>
    </StyledColumnBlock>
  );
}

export default memo(ColumnBlock);
