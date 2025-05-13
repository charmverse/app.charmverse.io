import React from 'react';
import { useDrag } from 'react-dnd';

type Props = {
  templateId: string;
  onAutoSizeColumn: (columnID: string) => void;
};

function HorizontalGrip(props: Props): JSX.Element {
  const [, drag] = useDrag(() => ({
    type: 'horizontalGrip',
    item: { id: props.templateId }
  }));

  return (
    <div ref={drag as any} className='HorizontalGrip' onDoubleClick={() => props.onAutoSizeColumn(props.templateId)} />
  );
}

export default React.memo(HorizontalGrip);
