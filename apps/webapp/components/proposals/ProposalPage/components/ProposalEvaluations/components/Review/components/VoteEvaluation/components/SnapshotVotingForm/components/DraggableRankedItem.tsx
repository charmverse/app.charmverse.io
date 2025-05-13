import { Close } from '@mui/icons-material';
import DragHandle from '@mui/icons-material/DragHandle';
import { Stack, Typography } from '@mui/material';
import type { Identifier, XYCoord } from 'dnd-core';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { Button } from 'components/common/Button';
import type { SnapshotProposal } from '@packages/lib/snapshot/interfaces';

import { DisplayChoiceScore } from './DisplayChoiceScore';

type DragItem = {
  index: number;
  id: string;
  type: string;
};

type Props = {
  selectedItem: number;
  removeItem: (item: number) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  index: number;
  label: string;
  snapshotProposal: SnapshotProposal;
};

export function DraggableRankedItem({ removeItem, selectedItem, index, label, moveItem, snapshotProposal }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'rankedItem',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveItem(dragIndex, hoverIndex);

      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'rankedItem',
    item: () => {
      return { selectedItem, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));

  return (
    <Stack direction='row' alignItems='center' gap={1}>
      <Button
        variant='outlined'
        color='textPrimary'
        data-handler-id={handlerId}
        sx={{ opacity: isDragging ? 0.1 : 1, flex: 1 }}
        ref={ref}
      >
        <Stack direction='row' justifyContent='space-between' alignItems='center' flex={1}>
          <Stack direction='row' alignItems='center' gap={1}>
            <DragHandle color='secondary' fontSize='small' />
            <Typography sx={{ width: '25px' }}>{index + 1}.</Typography>
          </Stack>
          <Typography>{label}</Typography>
          <Stack
            sx={{ width: '25px', cursor: 'pointer', alignItems: 'flex-end' }}
            onClick={(e) => {
              e.preventDefault();
              removeItem(selectedItem);
            }}
          >
            <Close color='secondary' fontSize='small' />
          </Stack>
        </Stack>
      </Button>

      <DisplayChoiceScore snapshotProposal={snapshotProposal} choice={label} />
    </Stack>
  );
}
