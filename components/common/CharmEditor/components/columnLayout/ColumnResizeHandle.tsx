import styled from '@emotion/styled';
import { useDrag } from 'react-dnd';

type Props = {
  columnId: string;
  onAutoSize: (columnId: string) => void;
};

const StyledGrip = styled.div`
  cursor: ew-resize;
  z-index: 1;
  width: 45px;
  height: 100%;
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  display: flex;
  justify-content: center;

  &:hover {
    > div {
      background-color: var(--secondary-text);
      width: 5px;
      height: 100%;
    }
  }
`;
// inpsired by HorizontalGrip.ts from focalboard
export function ColumnResizeHandle(props: Props): JSX.Element {
  const [collection, drag] = useDrag(() => ({
    type: 'column_resizer',
    item: { id: props.columnId },
    end: (item, monitor) => {
      // console.log('end dragging', item, monitor);
    }
  }));

  return (
    <StyledGrip ref={drag} className='charm-column-resizer' onDoubleClick={() => props.onAutoSize(props.columnId)}>
      <div />
    </StyledGrip>
  );
}
