import type { MenuItemProps } from '@mui/material/MenuItem';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import NextLink from 'next/link';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import WorkspaceAvatar from './WorkspaceAvatar';

interface SpaceListItemProps extends MenuItemProps {
  space: Space;
  changeOrderHandler: (draggedProperty: string, droppedOnProperty: string) => Promise<void>;
}

export default function SpaceListItem({ space, changeOrderHandler, selected, disabled }: SpaceListItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const [, drag] = useDrag(() => ({
    type: 'spaceItem',
    item: space,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: 'spaceItem',
      drop: async (droppedProperty: Space, monitor) => {
        const didDrop = monitor.didDrop();

        if (didDrop) {
          return;
        }

        if (droppedProperty.id !== space.id) {
          await changeOrderHandler(droppedProperty.id, space.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    }),
    [space, changeOrderHandler]
  );

  drag(drop(ref));

  return (
    <MenuItem
      key={space.domain}
      component={NextLink}
      href={`/${space.domain}`}
      sx={{
        boxSizing: 'content-box',
        maxWidth: '276px',
        ...(isOver && canDrop && { borderTopWidth: 2, borderStyle: 'solid', borderColor: 'action.active' })
      }}
      ref={ref}
      selected={selected}
      disabled={disabled}
    >
      <WorkspaceAvatar name={space.name} image={space.spaceImage} />
      <Typography noWrap ml={1}>
        {space.name}
      </Typography>
    </MenuItem>
  );
}
